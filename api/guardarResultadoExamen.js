export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');
  
    const { id, visitanteId, respuestas, puntaje } = req.body;
    const fecha = new Date().toISOString();
  
    const archivo = `evaluaciones/${id}/resultados.json`;
    const repo = "conquiguias/conquiguias";
  
    // Leer el archivo actual desde GitHub
    const respuesta = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  
    let resultados = [];
    let sha = null;
  
    if (respuesta.ok) {
      const data = await respuesta.json();
      const decoded = Buffer.from(data.content, 'base64').toString();
      resultados = JSON.parse(decoded);
      sha = data.sha;
    }
  
    // Verificar si ya existe un resultado para este usuario
    const resultadoExistente = resultados.find(r => r.visitanteId === visitanteId);
  
    if (resultadoExistente) {
      return res.status(409).send("❌ Ya has realizado este examen.");
    }
  
    // Agregar el nuevo resultado
    const nuevoResultado = {
      visitanteId,
      respuestas,
      puntaje,
      fecha
    };
  
    resultados.push(nuevoResultado);
    const contenidoCodificado = Buffer.from(JSON.stringify(resultados, null, 2)).toString('base64');
  
    // Guardar el archivo actualizado en GitHub
    const guardar = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Nuevo resultado de examen para ${id}`,
        content: contenidoCodificado,
        branch: 'main',
        ...(sha && { sha })
      })
    });
  
    if (guardar.ok) {
      res.status(200).json({ 
        ok: true, 
        message: "✅ Examen enviado correctamente.",
        puntaje: puntaje
      });
    } else {
      const error = await guardar.json();
      console.error(error);
      res.status(500).send("❌ Error al guardar resultado del examen.");
    }
  }