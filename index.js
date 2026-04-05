const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Runs every minute to check for tasks that need notifications
exports.checkTaskNotifications = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async () => {
    const now = new Date();
    const in10 = new Date(now.getTime() + 10 * 60 * 1000); // 10 min from now
    const in11 = new Date(now.getTime() + 11 * 60 * 1000); // 11 min window

    const snapshot = await db.collection('devices').get();

    for (const doc of snapshot.docs) {
      const { token, tasks } = doc.data();
      if (!token || !tasks) continue;

      let taskList;
      try { taskList = JSON.parse(tasks); } catch(e) { continue; }

      for (const task of taskList) {
        if (task.done || !task.fecha || !task.hora) continue;

        const deadline = new Date(`${task.fecha}T${task.hora}:00`);
        // Send notification if deadline is between 10 and 11 minutes from now
        if (deadline >= in10 && deadline < in11) {
          try {
            await admin.messaging().send({
              token,
              notification: {
                title: `⏰ En 10 min: ${task.titulo}`,
                body: `Categoría: ${task.categoria} · Prioridad: ${task.prioridad}`
              },
              android: {
                priority: 'high',
                notification: { sound: 'default', channelId: 'tareas' }
              },
              webpush: {
                notification: {
                  icon: 'https://rsacosta16.github.io/gestortareas/icon.svg',
                  vibrate: [200, 100, 200],
                  requireInteraction: true
                }
              }
            });
            console.log(`Notif sent for task: ${task.titulo}`);
          } catch(e) {
            console.error('Error sending notification:', e.message);
            // Token expired, remove device
            if (e.code === 'messaging/registration-token-not-registered') {
              await doc.ref.delete();
            }
          }
        }
      }
    }
    return null;
  });
