export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { id, titulo, fechaCierre, evaluation, imagenEspecialidad, imagenFirma1, imagenFirma2, imagenFirma3 } = req.body;

    // Validar campos requeridos
    if (!id || !titulo || !fechaCierre) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const archivoFormularios = `data/formularios.json`;
    const repo = "proyectoja/asistencia-especialidades";

    // Obtener archivo actual de formularios
    const resp = await fetch(`https://api.github.com/repos/${repo}/contents/${archivoFormularios}`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    let data = {};
    let sha = null;

    if (resp.ok) {
      const archivoJson = await resp.json();
      const contenido = Buffer.from(archivoJson.content, "base64").toString();
      data = JSON.parse(contenido);
      sha = archivoJson.sha;
    } else if (resp.status !== 404) {
      const errorText = await resp.text();
      console.error("Error al obtener formularios:", errorText);
      return res.status(500).json({ error: "Error al acceder al repositorio" });
    }

    // Validar si ya existe el ID
    if (data[id]) {
      return res.status(409).json({ error: `El formulario con ID '${id}' ya existe.` });
    }

    // Agregar nuevo formulario CON LAS 3 FIRMAS
    data[id] = {
      titulo,
      fechaCierre,
      creado: new Date().toISOString(),
      tieneEvaluacion: !!evaluation,
      imagenEspecialidad: imagenEspecialidad || null,
      imagenFirma1: imagenFirma1 || null,
      imagenFirma2: imagenFirma2 || null,
      imagenFirma3: imagenFirma3 || null
    };

    const nuevoContenido = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

    // Guardar formulario en GitHub
    const guardarFormulario = await fetch(`https://api.github.com/repos/${repo}/contents/${archivoFormularios}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Formulario creado: ${id}`,
        content: nuevoContenido,
        branch: "main",
        ...(sha && { sha }),
      }),
    });

    if (!guardarFormulario.ok) {
      const errorData = await guardarFormulario.json();
      console.error("Error al guardar formulario:", errorData);
      return res.status(500).json({ error: errorData.message || "Error al guardar formulario" });
    }

    // Si hay evaluación, guardarla también
    if (evaluation && evaluation.length > 0) {
      try {
        const archivoEvaluacion = `evaluaciones/${id}/evaluacion.json`;
        const contenidoEvaluacion = Buffer.from(JSON.stringify(evaluation, null, 2)).toString("base64");

        const guardarEvaluacion = await fetch(`https://api.github.com/repos/${repo}/contents/${archivoEvaluacion}`, {
          method: "PUT",
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Evaluación creada para formulario ${id}`,
            content: contenidoEvaluacion,
            branch: "main",
          }),
        });

        if (!guardarEvaluacion.ok) {
          console.warn("Formulario creado pero no se pudo guardar la evaluación");
        }
      } catch (evalError) {
        console.warn("Error al guardar evaluación:", evalError);
      }
    }

    res.status(200).json({ 
      ok: true, 
      message: "Formulario creado exitosamente",
      id: id
    });

  } catch (err) {
    console.error("Error general:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
}