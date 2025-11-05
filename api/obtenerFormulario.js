export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: "ID no especificado" });

  const archivo = `data/formularios.json`;
  const repo = "conquiguias/conquiguias";

  try {
    const respuesta = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!respuesta.ok) {
      return res.status(404).json({ error: "Formulario no encontrado" });
    }

    const data = await respuesta.json();
    const contenido = JSON.parse(Buffer.from(data.content, 'base64').toString());

    if (!contenido[id]) {
      return res.status(404).json({ error: "Formulario no encontrado" });
    }

    const formulario = contenido[id];
    const fechaCierre = new Date(formulario.fechaCierre);
    const ahora = new Date();
    const estado = ahora > fechaCierre ? "cerrado" : "abierto";
    
    res.status(200).json({ 
      ...formulario, 
      estado,
      imagenEspecialidad: formulario.imagenEspecialidad || null,
      imagenFirma1: formulario.imagenFirma1 || null,
      imagenFirma2: formulario.imagenFirma2 || null,
      imagenFirma3: formulario.imagenFirma3 || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener formulario" });
  }
}