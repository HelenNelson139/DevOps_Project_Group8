import torch

from core.model import DRQN


def test_drqn_inference_output_has_one_q_value_per_action():
    model = DRQN(n_observations=8, n_actions=5)
    batch = torch.zeros((2, 10, 8), dtype=torch.float32)

    q_values, hidden = model(batch)

    assert q_values.shape == (2, 5)
    assert hidden is not None


def test_drqn_training_output_keeps_sequence_dimension():
    model = DRQN(n_observations=8, n_actions=5)
    batch = torch.zeros((2, 10, 8), dtype=torch.float32)

    q_values, _ = model(batch, return_all=True)

    assert q_values.shape == (2, 10, 5)
