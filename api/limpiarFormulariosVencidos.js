export default async function handler(req, res) {
    const repo = "conquiguias/conquiguias";
    const archivoFormularios = `data/formularios.json`;
  
    try {
      // Cargar formulario.json
      const respuesta = await fetch(`https://api.github.com/repos/${repo}/contents/${archivoFormularios}`, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        }
      });
  
      if (!respuesta.ok) throw new Error("No se pudo acceder a formularios.json");
  
      const datos = await respuesta.json();
      const contenido = JSON.parse(Buffer.from(datos.content, 'base64').toString());
      const sha = datos.sha;
  
      const ahora = new Date();
      const formulariosVigentes = {};
      const formulariosVencidos = [];
  
      // Revisar cada formulario
      for (const [id, info] of Object.entries(contenido)) {
        const fechaCreado = new Date(info.creado || info.fechaCierre); // fallback
        const diferenciaDias = (ahora - fechaCreado) / (1000 * 60 * 60 * 24);
  
        if (diferenciaDias >= 90) {
          formulariosVencidos.push(id);
        } else {
          formulariosVigentes[id] = info;
        }
      }
  
      // Si no hay nada para borrar
      if (formulariosVencidos.length === 0) {
        return res.status(200).json({ mensaje: "✅ No hay formularios vencidos" });
      }
  
      // Actualizar formularios.json sin los vencidos
      const nuevoContenido = Buffer.from(JSON.stringify(formulariosVigentes, null, 2)).toString('base64');
      await fetch(`https://api.github.com/repos/${repo}/contents/${archivoFormularios}`, {
        method: "PUT",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `⏳ Eliminar formularios vencidos (${formulariosVencidos.join(", ")})`,
          content: nuevoContenido,
          sha,
          branch: "main"
        })
      });
  
      // Borrar archivos de respuestas vencidas
      for (const id of formulariosVencidos) {
        const ruta = `respuestas/${id}/respuestas.json`;
  
        const archivoRes = await fetch(`https://api.github.com/repos/${repo}/contents/${ruta}`, {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            "Content-Type": "application/json"
          }
        });
  
        if (archivoRes.ok) {
          const datosArchivo = await archivoRes.json();
          await fetch(`https://api.github.com/repos/${repo}/contents/${ruta}`, {
            method: "DELETE",
            headers: {
              Authorization: `token ${process.env.GITHUB_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              message: `⏳ Eliminar respuestas de formulario vencido ${id}`,
              sha: datosArchivo.sha,
              branch: "main"
            })
          });
        }
      }
  
      res.status(200).json({
        mensaje: `🧹 Formularios vencidos eliminados: ${formulariosVencidos.join(", ")}`,
        total: formulariosVencidos.length
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "❌ Error al limpiar formularios vencidos." });
    }
  }
  