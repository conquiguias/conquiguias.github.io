export default async function handler(req, res) {
    const repo = "conquiguias/conquiguias";
    const archivo = `data/formularios.json`;
  
    try {
      const respuesta = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        }
      });
  
      if (!respuesta.ok) throw new Error("No se pudo acceder a formularios.json");
  
      const datos = await respuesta.json();
      const contenido = JSON.parse(Buffer.from(datos.content, 'base64').toString());
  
      res.status(200).json(contenido);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "❌ Error al obtener los formularios." });
    }
  }
  