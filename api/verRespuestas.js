export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: "ID no especificado" });

  const archivo = `respuestas/${id}/respuestas.json`;
  const repo = "proyectoja/asistencia-especialidades";

  try {
    const respuesta = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    let registros = [];
    if (respuesta.ok) {
      const data = await respuesta.json();
      const decoded = Buffer.from(data.content, 'base64').toString();
      registros = JSON.parse(decoded);
    }

    // Obtener resultados de exámenes si existen
    let resultadosExamen = [];
    try {
      const resExamen = await fetch(`https://api.github.com/repos/${repo}/contents/evaluaciones/${id}/resultados.json`, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (resExamen.ok) {
        const dataExamen = await resExamen.json();
        const decodedExamen = Buffer.from(dataExamen.content, 'base64').toString();
        resultadosExamen = JSON.parse(decodedExamen);
      }
    } catch (error) {
      console.log('No hay resultados de examen o error al cargarlos');
    }

    // Combinar datos de asistencia con resultados de examen
    const datosCombinados = {
      asistencias: registros,
      examenes: resultadosExamen
    };

    res.status(200).json(datosCombinados);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener respuestas" });
  }
}