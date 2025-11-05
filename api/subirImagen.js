export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');
  
    const { carpeta, nombre, contenido, tipo } = req.body;
  
    if (!carpeta || !nombre || !contenido) {
      return res.status(400).json({ error: "Datos incompletos" });
    }
  
    const repo = "proyectoja/asistencia-especialidades";
    const archivo = `images/${carpeta}/${nombre}`;
  
    try {
      // Verificar si la imagen ya existe
      const verificar = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (verificar.ok) {
        return res.status(409).json({ error: "❌ Ya existe una imagen con ese nombre" });
      }
  
      // Subir la imagen
      const guardar = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Subir imagen: ${nombre} en ${carpeta}`,
          content: contenido,
          branch: 'main'
        })
      });
  
      if (guardar.ok) {
        res.status(200).json({ 
          ok: true, 
          message: "✅ Imagen subida correctamente",
          url: `https://asistencia-especialidades.vercel.app/images/${carpeta}/${nombre}`
        });
      } else {
        const error = await guardar.json();
        res.status(500).json({ error: error.message || "Error al subir imagen" });
      }
    } catch (err) {
      console.error("Error al subir imagen:", err);
      res.status(500).json({ error: "Error al subir imagen" });
    }
  }