// api/social.js - VERSIÓN CON MODERACIÓN MANUAL
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;

// 🔒 Estados de publicación
const POST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export default async function handler(req, res) {
  // Configurar CORS (código existente)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'upload':
        await handleUpload(req, res);
        break;
      case 'delete':
        await handleDelete(req, res);
        break;
      case 'health':
        res.status(200).json({ status: 'OK', message: 'Social API is running' });
        break;
      case 'get-pending-posts':
        await handleGetPendingPosts(req, res);
        break;
      case 'approve-post':
        await handleApprovePost(req, res);
        break;
      case 'reject-post':
        await handleRejectPost(req, res);
        break;
      default:
        res.status(400).json({ error: 'Acción no válida' });
    }
  } catch (error) {
    console.error('Error en social API:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error interno del servidor' 
    });
  }
}

// 🔒 Obtener publicaciones pendientes de aprobación
async function handleGetPendingPosts(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // En una implementación real, aquí conectarías con tu base de datos
    // Por ahora retornamos un array vacío que se llenará desde el frontend
    res.status(200).json({
      success: true,
      posts: []
    });

  } catch (error) {
    console.error('Error obteniendo posts pendientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener publicaciones pendientes'
    });
  }
}

// 🔒 Aprobar publicación
async function handleApprovePost(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'ID de publicación requerido' });
    }

    // En una implementación real, actualizarías el estado en la base de datos
    console.log(`✅ Publicación ${postId} aprobada por administrador`);

    res.status(200).json({
      success: true,
      message: 'Publicación aprobada correctamente'
    });

  } catch (error) {
    console.error('Error aprobando publicación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al aprobar la publicación'
    });
  }
}

// 🔒 Rechazar publicación
async function handleRejectPost(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { postId, deletehash } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'ID de publicación requerido' });
    }

    // Eliminar de Imgur si se proporciona deletehash
    if (deletehash) {
      await fetch(`https://api.imgur.com/3/image/${deletehash}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
        }
      });
    }

    console.log(`❌ Publicación ${postId} rechazada y eliminada`);

    res.status(200).json({
      success: true,
      message: 'Publicación rechazada y eliminada correctamente'
    });

  } catch (error) {
    console.error('Error rechazando publicación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al rechazar la publicación'
    });
  }
}



// Manejar subida de archivos
async function handleUpload(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { file: fileData, fileName, fileType } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    // Convertir base64 a blob
    const base64Data = fileData.split(',')[1] || fileData;
    const binaryData = Buffer.from(base64Data, 'base64');
    const blob = new Blob([binaryData], { type: fileType });

    const formData = new FormData();
    formData.append('image', blob, fileName || 'upload');

    const imgurResponse = await fetch('https://api.imgur.com/3/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: formData
    });

    if (!imgurResponse.ok) {
      const errorData = await imgurResponse.json();
      throw new Error(errorData.data?.error || `Imgur API error: ${imgurResponse.status}`);
    }

    const imgurData = await imgurResponse.json();
    
    res.status(200).json({ 
      success: true, 
      link: imgurData.data.link,
      id: imgurData.data.id,
      deletehash: imgurData.data.deletehash
    });

  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al subir la imagen' 
    });
  }
}

// Manejar eliminación de archivos
async function handleDelete(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { deletehash } = req.body;

  if (!deletehash) {
    return res.status(400).json({ error: 'Deletehash requerido' });
  }

  try {
    const response = await fetch(`https://api.imgur.com/3/image/${deletehash}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
      }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar imagen de Imgur');
    }

    res.status(200).json({ 
      success: true, 
      message: 'Imagen eliminada correctamente' 
    });

  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al eliminar la imagen' 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};