const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializar Firebase Admin
admin.initializeApp();

console.log("✅ Firebase Functions inicializado para Conquiguias World");

/**
 * 🚀 FUNCIÓN PRINCIPAL: Actualizar posts cuando cambia el perfil
 */
exports.onUserProfileUpdate = functions.firestore
  .document('usuarios/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    console.log(`🔔 Iniciando actualización para usuario: ${userId}`);

    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Verificar cambios relevantes
      const nameChanged = beforeData.nombre !== afterData.nombre || 
                         beforeData.apellido !== afterData.apellido;
      const photoChanged = beforeData.fotoURL !== afterData.fotoURL;

      if (!nameChanged && !photoChanged) {
        console.log("ℹ️ No hay cambios relevantes");
        return null;
      }

      console.log(`📝 Cambios detectados: nombre=${nameChanged}, foto=${photoChanged}`);

      // Preparar datos de actualización
      const updateData = {};
      if (nameChanged) {
        updateData.userName = `${afterData.nombre || ''} ${afterData.apellido || ''}`.trim();
      }
      if (photoChanged) {
        updateData.userPhoto = afterData.fotoURL;
      }

      // Buscar posts del usuario
      const postsRef = admin.firestore().collection('posts');
      const userPostsSnapshot = await postsRef
        .where('userId', '==', userId)
        .where('status', '==', 'approved')
        .limit(100)
        .get();

      console.log(`📊 Encontrados ${userPostsSnapshot.size} posts`);

      if (userPostsSnapshot.size === 0) {
        return { 
          success: true, 
          message: "No hay posts para actualizar",
          updatedPosts: 0 
        };
      }

      // Actualizar en lote
      const batch = admin.firestore().batch();
      userPostsSnapshot.forEach((doc) => {
        batch.update(doc.ref, updateData);
      });

      await batch.commit();

      console.log(`✅ Éxito: Actualizados ${userPostsSnapshot.size} posts`);

      return {
        success: true,
        updatedPosts: userPostsSnapshot.size,
        changes: { name: nameChanged, photo: photoChanged }
      };

    } catch (error) {
      console.error('❌ Error:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * ✅ FUNCIÓN DE PRUEBA
 */
exports.helloConquiguias = functions.https.onRequest((request, response) => {
  response.json({
    message: "¡Hola desde Conquiguias World! 🚀",
    project: "conquiguias-world-85ccd",
    timestamp: new Date().toISOString()
  });
});