// ============================================================
// pwa-init.js — Registra PWA e gerencia notificações
// Adicione no <head> de todas as páginas da dashboard:
//   <script src="pwa-init.js" defer></script>
// ============================================================

(function () {
  // ── Registra Service Worker ──
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .then(reg => {
          console.info("[PWA] Service Worker registrado:", reg.scope);
          window._swRegistration = reg;

          // Escuta mensagens do SW (sync queue, auto check-in)
          navigator.serviceWorker.addEventListener("message", event => {
            if (event.data?.type === "SYNC_QUEUE") {
              // Dispara sync da fila se a integração estiver carregada
              window.FinWiseSync?.flush?.();
            }
            if (event.data?.type === "AUTO_CHECKIN") {
              // Acionado quando usuário clica "Fazer check-in" na notificação
              window.fazerCheckin?.();
            }
          });
        })
        .catch(err => console.warn("[PWA] Falha ao registrar SW:", err));
    });
  }

  // ── Prompt de instalação (botão "Instalar app") ──
  let installPrompt = null;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;

    // Mostra botão de instalação se existir na página
    const btn = document.getElementById("pwa-install-btn");
    if (btn) {
      btn.style.display = "flex";
      btn.addEventListener("click", () => {
        installPrompt.prompt();
        installPrompt.userChoice.then(result => {
          if (result.outcome === "accepted") {
            btn.style.display = "none";
            console.info("[PWA] App instalado.");
          }
          installPrompt = null;
        });
      });
    }
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    console.info("[PWA] FinWise instalado com sucesso.");
  });

  // ── Notificações Push ──
  window.FinWisePush = {
    // Solicita permissão de notificação
    async requestPermission() {
      if (!("Notification" in window)) return "unsupported";
      if (Notification.permission === "granted") return "granted";
      const result = await Notification.requestPermission();
      return result;
    },

    // Agenda notificação local (sem backend) — ex: lembrete diário do check-in
    scheduleCheckinReminder(hourUTC = 20) {
      if (Notification.permission !== "granted") return;

      // Salva preferência
      localStorage.setItem("fw_push_hour", String(hourUTC));

      // Verifica a cada hora se está na hora do lembrete
      setInterval(() => {
        const now = new Date();
        const isRightHour = now.getUTCHours() === hourUTC;
        const lastReminder = localStorage.getItem("fw_last_reminder");
        const today = now.toISOString().slice(0, 10);

        if (isRightHour && lastReminder !== today) {
          const lastCheckin = JSON.parse(
            localStorage.getItem("fw_desafio_state") || "{}"
          )?.lastCheckin;

          // Só lembra se ainda não fez check-in hoje
          if (lastCheckin !== today) {
            localStorage.setItem("fw_last_reminder", today);
            this._mostrarNotificacaoLocal();
          }
        }
      }, 60 * 1000); // checa a cada 1 minuto
    },

    _mostrarNotificacaoLocal() {
      if (!window._swRegistration) return;
      const streak = JSON.parse(
        localStorage.getItem("fw_desafio_state") || "{}"
      )?.streak || 0;

      window._swRegistration.showNotification("FinWise 🔥", {
        body: streak > 0
          ? `Você tem ${streak} dias de sequência! Não perca hoje.`
          : "Que tal começar seu desafio hoje? Cada real economizado conta.",
        icon: "./icon-192.png",
        badge: "./icon-96.png",
        tag: "finwise-checkin",
        renotify: true,
        data: { url: "./desafio-grupo.html" },
        actions: [
          { action: "checkin", title: "✅ Fazer check-in" },
          { action: "dismiss", title: "Depois" },
        ],
      });
    },

    // TODO para o dev Android:
    // Para push via backend, você precisa:
    // 1. Gerar chaves VAPID: npx web-push generate-vapid-keys
    // 2. Salvar a subscription do usuário no banco
    // 3. Enviar push pelo servidor com a lib web-push (Node) ou equivalente
    //
    // async subscribe(vapidPublicKey) {
    //   const reg = window._swRegistration;
    //   const sub = await reg.pushManager.subscribe({
    //     userVisibleOnly: true,
    //     applicationServerKey: vapidPublicKey,
    //   });
    //   // Envie 'sub' para o backend salvar
    //   await fetch('/api/push/subscribe', {
    //     method: 'POST',
    //     body: JSON.stringify(sub),
    //     headers: { 'Content-Type': 'application/json' },
    //   });
    // },
  };

  // Inicia lembrete de check-in às 20h UTC (17h BRT) automaticamente
  document.addEventListener("DOMContentLoaded", () => {
    // Pede permissão somente se usuário já usou o desafio
    const hasDesafio = localStorage.getItem("fw_desafio_state");
    if (hasDesafio && Notification.permission === "default") {
      setTimeout(() => {
        window.FinWisePush.requestPermission().then(result => {
          if (result === "granted") {
            window.FinWisePush.scheduleCheckinReminder(20);
          }
        });
      }, 5000); // pergunta após 5s na página
    } else if (Notification.permission === "granted") {
      window.FinWisePush.scheduleCheckinReminder(20);
    }
  });
})();