export default async function handler(req, res) {
    const { id } = req.query;
  
    if (!id) return res.status(400).json({ error: "ID no especificado" });
  
    const archivo = `evaluaciones/${id}/evaluacion.json`;
    const repo = "proyectoja/asistencia-especialidades";
  
    try {
      const respuesta = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!respuesta.ok) return res.status(404).json({ error: "Evaluación no encontrada" });
  
      const data = await respuesta.json();
      const decoded = Buffer.from(data.content, 'base64').toString();
      const evaluacion = JSON.parse(decoded);
  
      res.status(200).json(evaluacion);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al obtener evaluación" });
    }
  }