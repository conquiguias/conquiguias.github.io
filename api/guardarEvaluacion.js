export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');
  
    const { id, evaluation } = req.body;
  
    const archivo = `evaluaciones/${id}/evaluacion.json`;
    const repo = "conquiguias/conquiguias";
  
    try {
      // Convertir evaluación a base64
      const contenidoCodificado = Buffer.from(JSON.stringify(evaluation, null, 2)).toString('base64');
  
      // Guardar en GitHub
      const guardar = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Evaluación creada para formulario ${id}`,
          content: contenidoCodificado,
          branch: 'main'
        })
      });
  
      if (guardar.ok) {
        res.status(200).json({ ok: true, message: "✅ Evaluación guardada correctamente." });
      } else {
        const error = await guardar.json();
        res.status(500).json({ error: error.message || "Error al guardar evaluación" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }