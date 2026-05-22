## Public Access With Ingress
The application is exposed through NGINX Ingress Controller on AKS.
Check the public IP:
```bash
kubectl get service --namespace ingress-nginx ingress-nginx-controller --output wide
```
Check the Ingress resource:
```
kubectl get ingress
kubectl describe ingress uit-dkhp-ingress
```
Public: http://20.44.237.162
