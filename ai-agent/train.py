import argparse
import random
from collections import deque
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F

from core.env import ACTION_NAMES, MAX_STEPS_PER_EPISODE, SCENARIO_NAMES, CanaryEnv
from core.model import DRQN


class EpisodeReplayBuffer:
    def __init__(self, capacity: int, seq_length: int):
        self.seq_length = seq_length
        self.episodes = deque(maxlen=capacity)

    def add_episode(self, transitions):
        if len(transitions) >= self.seq_length:
            self.episodes.append(transitions)

    def can_sample(self, batch_size: int) -> bool:
        return len(self.episodes) >= batch_size

    def sample(self, batch_size: int):
        sampled_episodes = random.sample(list(self.episodes), batch_size)
        states, actions, rewards, next_states, dones = [], [], [], [], []

        for episode in sampled_episodes:
            start = random.randint(0, len(episode) - self.seq_length)
            chunk = episode[start : start + self.seq_length]

            states.append([item[0] for item in chunk])
            actions.append([item[1] for item in chunk])
            rewards.append([item[2] for item in chunk])
            next_states.append([item[3] for item in chunk])
            dones.append([item[4] for item in chunk])

        return (
            torch.tensor(np.array(states), dtype=torch.float32),
            torch.tensor(np.array(actions), dtype=torch.long),
            torch.tensor(np.array(rewards), dtype=torch.float32),
            torch.tensor(np.array(next_states), dtype=torch.float32),
            torch.tensor(np.array(dones), dtype=torch.float32),
        )


def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def detach_hidden(hidden):
    if hidden is None:
        return None
    return tuple(item.detach() for item in hidden)


def select_action(env, model, state, hidden, epsilon: float, device):
    if random.random() < epsilon:
        return env.action_space.sample(), hidden

    state_tensor = torch.tensor(state, dtype=torch.float32, device=device).view(1, 1, -1)

    with torch.no_grad():
        q_values, new_hidden = model(state_tensor, hidden)

    action = int(torch.argmax(q_values, dim=1).item())
    return action, detach_hidden(new_hidden)


def optimize(policy_net, target_net, replay, optimizer, batch_size, gamma, device, grad_clip):
    states, actions, rewards, next_states, dones = replay.sample(batch_size)
    states = states.to(device)
    actions = actions.to(device)
    rewards = rewards.to(device)
    next_states = next_states.to(device)
    dones = dones.to(device)

    q_all, _ = policy_net(states, return_all=True)
    current_q = q_all.gather(2, actions.unsqueeze(2)).squeeze(2)

    with torch.no_grad():
        next_q_policy, _ = policy_net(next_states, return_all=True)
        next_actions = next_q_policy.argmax(dim=2, keepdim=True)

        next_q_target, _ = target_net(next_states, return_all=True)
        next_q = next_q_target.gather(2, next_actions).squeeze(2)
        target_q = rewards + gamma * next_q * (1.0 - dones)

    loss = F.smooth_l1_loss(current_q, target_q)

    optimizer.zero_grad()
    loss.backward()
    torch.nn.utils.clip_grad_norm_(policy_net.parameters(), max_norm=grad_clip)
    optimizer.step()

    return float(loss.item())


def resolve_device(device_name: str):
    if device_name == "cuda" and not torch.cuda.is_available():
        print("cuda_unavailable=true fallback=cpu")
        return torch.device("cpu")
    return torch.device(device_name)


def train(args):
    set_seed(args.seed)

    device = resolve_device(args.device)
    env = CanaryEnv()
    policy_net = DRQN().to(device)
    target_net = DRQN().to(device)
    target_net.load_state_dict(policy_net.state_dict())
    target_net.eval()

    optimizer = torch.optim.Adam(policy_net.parameters(), lr=args.lr)
    replay = EpisodeReplayBuffer(args.replay_capacity, args.seq_length)

    best_avg_reward = float("-inf")
    reward_window = deque(maxlen=args.score_window)

    save_best_path = Path(args.save_best)
    save_final_path = Path(args.save_final)
    save_best_path.parent.mkdir(parents=True, exist_ok=True)
    save_final_path.parent.mkdir(parents=True, exist_ok=True)

    print(
        "training_start device={device} episodes={episodes} seq_length={seq_length} "
        "batch_size={batch_size} lr={lr}".format(
            device=device,
            episodes=args.episodes,
            seq_length=args.seq_length,
            batch_size=args.batch_size,
            lr=args.lr,
        )
    )

    for episode_idx in range(1, args.episodes + 1):
        state, _ = env.reset()
        hidden = None
        transitions = []
        episode_reward = 0.0
        losses = []
        action_trace = []

        epsilon = max(
            args.epsilon_end,
            args.epsilon_start
            - (args.epsilon_start - args.epsilon_end) * (episode_idx / args.epsilon_decay_episodes),
        )

        for _ in range(MAX_STEPS_PER_EPISODE + args.step_margin):
            action, hidden = select_action(env, policy_net, state, hidden, epsilon, device)
            action_trace.append(ACTION_NAMES.get(action, f"action-{action}"))

            next_state, reward, done, truncated, _ = env.step(action)
            done_flag = done or truncated

            transitions.append((state, action, reward, next_state, float(done_flag)))
            episode_reward += reward
            state = next_state

            if replay.can_sample(args.batch_size):
                losses.append(
                    optimize(
                        policy_net,
                        target_net,
                        replay,
                        optimizer,
                        args.batch_size,
                        args.gamma,
                        device,
                        args.grad_clip,
                    )
                )

            if done_flag:
                break

        replay.add_episode(transitions)
        reward_window.append(episode_reward)

        if episode_idx % args.target_update == 0:
            target_net.load_state_dict(policy_net.state_dict())

        avg_reward = float(np.mean(reward_window))
        if len(reward_window) == args.score_window and avg_reward > best_avg_reward:
            best_avg_reward = avg_reward
            torch.save(policy_net.state_dict(), save_best_path)

        if episode_idx % args.log_every == 0 or episode_idx == 1:
            scenario_name = SCENARIO_NAMES.get(env.scenario, "Unknown")
            mean_loss = float(np.mean(losses)) if losses else 0.0
            print(
                "episode={episode} scenario={scenario} reward={reward:.2f} "
                "avg_reward={avg:.2f} best_avg={best:.2f} epsilon={epsilon:.3f} "
                "loss={loss:.4f} replay_episodes={replay_size} actions={actions}".format(
                    episode=episode_idx,
                    scenario=scenario_name,
                    reward=episode_reward,
                    avg=avg_reward,
                    best=best_avg_reward if best_avg_reward != float("-inf") else 0.0,
                    epsilon=epsilon,
                    loss=mean_loss,
                    replay_size=len(replay.episodes),
                    actions="->".join(action_trace),
                )
            )

    torch.save(policy_net.state_dict(), save_final_path)

    if not save_best_path.exists():
        torch.save(policy_net.state_dict(), save_best_path)

    print(f"saved_best={save_best_path}")
    print(f"saved_final={save_final_path}")


def parse_args():
    parser = argparse.ArgumentParser(description="Train the DRQN canary release advisor.")
    parser.add_argument("--episodes", type=int, default=1000)
    parser.add_argument("--seq-length", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--replay-capacity", type=int, default=3000)
    parser.add_argument("--gamma", type=float, default=0.99)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--target-update", type=int, default=50)
    parser.add_argument("--score-window", type=int, default=100)
    parser.add_argument("--log-every", type=int, default=10)
    parser.add_argument("--epsilon-start", type=float, default=1.0)
    parser.add_argument("--epsilon-end", type=float, default=0.05)
    parser.add_argument("--epsilon-decay-episodes", type=int, default=800)
    parser.add_argument("--grad-clip", type=float, default=1.0)
    parser.add_argument("--step-margin", type=int, default=10)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--device", default="cpu", choices=["cpu", "cuda"])
    parser.add_argument("--save-best", default="models/model_canary_drqn_best.pth")
    parser.add_argument("--save-final", default="models/model_canary_drqn_final.pth")
    return parser.parse_args()


if __name__ == "__main__":
    train(parse_args())
