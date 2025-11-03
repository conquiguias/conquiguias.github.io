export default async function handler(req, res) {
    if (req.method !== "GET")
      return res.status(405).json({ error: "Método no permitido" });
  
    const { id, correo } = req.query;
    if (!id || !correo)
      return res.status(400).json({ error: "Faltan parámetros: id o correo." });
  
    const repo = "proyectoja/asistencia-especialidades";
    const archivo = `respuestas/${id}/respuestas.json`;
  
    try {
      const respuesta = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!respuesta.ok) {
        return res.status(200).json({ success: true, total: 0, asistencias: [] });
      }
  
      const data = await respuesta.json();
      const decoded = Buffer.from(data.content, "base64").toString();
      const registros = JSON.parse(decoded);
      const asistencias = registros.filter(r => r.correo === correo);
  
      res.status(200).json({
        success: true,
        total: asistencias.length,
        asistencias,
      });
    } catch (error) {
      console.error("❌ Error al leer asistencias:", error);
      res.status(500).json({ error: "Error al leer asistencias desde el repositorio." });
    }
  }
  