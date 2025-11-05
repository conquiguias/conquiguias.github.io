export default async function handler(req, res) {
    const { carpeta } = req.query;
  
    if (!carpeta || (carpeta !== 'especialidades' && carpeta !== 'firmas')) {
      return res.status(400).json({ error: "Carpeta no válida" });
    }
  
    const repo = "proyectoja/asistencia-especialidades";
    const ruta = `images/${carpeta}`;
  
    try {
      const respuesta = await fetch(`https://api.github.com/repos/${repo}/contents/${ruta}`, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
  
      let imagenes = [];
  
      if (respuesta.ok) {
        const archivos = await respuesta.json();
        
        // Filtrar solo archivos de imagen
        imagenes = archivos
          .filter(archivo => 
            archivo.type === 'file' && 
            /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(archivo.name)
          )
          .map(archivo => ({
            nombre: archivo.name,
            url: archivo.download_url,
            ruta: archivo.path
          }));
      } else if (respuesta.status !== 404) {
        throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
      }
  
      res.status(200).json(imagenes);
    } catch (err) {
      console.error("Error al listar imágenes:", err);
      res.status(500).json({ error: "Error al listar imágenes" });
    }
  }