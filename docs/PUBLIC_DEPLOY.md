# Public Deployment

This setup publishes the dashboard as a read-only website:

- Frontend: Vercel, root directory `frontend`
- Backend: Render, using `render.yaml`
- Public mode: `VR_PUBLIC_READONLY=true`

## 1. Push This Project To GitHub

Create a GitHub repository and push this folder:

```powershell
git remote add origin https://github.com/<your-name>/<your-repo>.git
git push -u origin main
```

## 2. Deploy Backend On Render

1. Open Render and choose `New +` -> `Blueprint`.
2. Select the GitHub repo.
3. Render reads `render.yaml` and creates `vibe-research-api`.
4. After deploy, copy the service URL, for example:

```text
https://vibe-research-api.onrender.com
```

The backend is read-only in public mode. Visitors can view data, but cannot call AI or mutate portfolio data.

## 3. Deploy Frontend On Vercel

1. Open Vercel and import the same GitHub repo.
2. Set root directory to `frontend`.
3. Add environment variable:

```text
VITE_API_URL=https://vibe-research-api.onrender.com
```

4. Deploy.

## 4. Share The Vercel URL

Share the Vercel URL with others. Do not share `127.0.0.1` URLs; those only work on the local machine.

## Notes

- Your local Desktop research folder is not uploaded.
- Online reports and built-in sector/Serenity data still render.
- If you want to publish selected local notes, copy sanitized markdown/PDF metadata into a cloud research folder or a database later.
