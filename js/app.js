window.onload = function () {
  var mapElement = document.getElementById("map");
  var chatMessages = document.getElementById("chat-messages");
  var chatForm = document.getElementById("chat-form");
  var chatInput = document.getElementById("chat-input");
  var chatSend = document.getElementById("chat-send");
  var voiceStart = document.getElementById("voice-start");
  var voiceStop = document.getElementById("voice-stop");
  var voiceStatus = document.getElementById("voice-status");

  var keywordReplies = {
    учеба: [
      "Сейчас основной фокус на веб-программировании и математике.",
      "По учебе стараюсь закреплять теорию практическими мини-проектами.",
      "Учебный план плотный, но даёт хорошую базу для разработки."
    ],
    вшэ: [
      "В ВШЭ нравится сочетание теории и практики.",
      "ВШЭ даёт много возможностей для проектной работы.",
      "В ВШЭ удобно прокачивать навыки через курсовые и командные задачи."
    ],
    проект: [
      "Сейчас развиваю персональный сайт и улучшаю интерфейсы.",
      "Учебные проекты помогают быстрее понять реальный workflow.",
      "В проектах тренирую структуру кода и работу с DOM."
    ],
    "javascript": [
      "JavaScript использую для интерактивности и логики интерфейса.",
      "В JS сейчас отрабатываю обработчики событий и Web API.",
      "JavaScript помогает оживить даже простой статический сайт."
    ],
    карта: [
      "Карта сделана на Leaflet и работает без серверной части.",
      "Для карты использую OpenStreetMap-слой и локальный маркер.",
      "Карта инициализируется на клиенте при загрузке страницы."
    ],
    привет: [
      "Привет! Рад видеть тебя на моей странице.",
      "Привет! Можешь спросить про учёбу, навыки или цели.",
      "Привет! Я онлайн в этом виртуальном чате."
    ]
  };

  var fallbackReplies = [
    "Интересный вопрос. Можешь уточнить чуть подробнее?",
    "Спасибо за сообщение. Расскажу об этом с удовольствием.",
    "Принял сообщение. Если хочешь, задай вопрос про учебу или проекты.",
    "Хороший запрос. Попробуй добавить ключевые слова: учеба, проект, ВШЭ."
  ];

  var recorder = null;
  var recorderChunks = [];
  var activeStream = null;

  function chooseRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function normalizeText(text) {
    return text.toLowerCase().trim();
  }

  function setVoiceStatus(text, isError) {
    voiceStatus.textContent = text;
    voiceStatus.classList.toggle("voice-status-error", Boolean(isError));
  }

  function scrollChatToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addTextMessage(text, role) {
    var bubble = document.createElement("div");
    bubble.className = "chat-message " + (role === "user" ? "user-message" : "author-message");
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    scrollChatToBottom();
  }

  function addVoiceMessage(blob, role) {
    var bubble = document.createElement("div");
    bubble.className = "chat-message " + (role === "user" ? "user-message" : "author-message");

    var audio = document.createElement("audio");
    audio.controls = true;
    audio.src = URL.createObjectURL(blob);
    audio.preload = "metadata";

    bubble.appendChild(audio);
    chatMessages.appendChild(bubble);
    scrollChatToBottom();
  }

  function getReplyForMessage(text) {
    var normalized = normalizeText(text);
    var keys = Object.keys(keywordReplies);
    var i;

    for (i = 0; i < keys.length; i += 1) {
      if (normalized.indexOf(keys[i]) !== -1) {
        return chooseRandom(keywordReplies[keys[i]]);
      }
    }

    return chooseRandom(fallbackReplies);
  }

  function scheduleAuthorReply(userText) {
    var reply = getReplyForMessage(userText);
    var delay = 400 + Math.floor(Math.random() * 501);

    window.setTimeout(function () {
      addTextMessage(reply, "author");
    }, delay);
  }

  function sendTextMessage() {
    var value = chatInput.value.trim();

    if (!value) {
      return;
    }

    addTextMessage(value, "user");
    chatInput.value = "";
    scheduleAuthorReply(value);
  }

  function releaseActiveStream() {
    if (activeStream) {
      activeStream.getTracks().forEach(function (track) {
        track.stop();
      });
      activeStream = null;
    }
  }

  function initMap() {
    if (!mapElement) {
      return;
    }

    if (typeof window.L === "undefined") {
      mapElement.textContent = "Не удалось загрузить библиотеку карты.";
      return;
    }

    var moscow = [55.7558, 37.6176];
    var map = window.L.map("map", { scrollWheelZoom: true }).setView(moscow, 11);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    window.L.marker(moscow)
      .addTo(map)
      .bindPopup("Я учусь в ВШЭ и развиваюсь в веб-разработке.")
      .openPopup();
  }

  function initChat() {
    if (!chatForm || !chatInput || !chatSend || !voiceStart || !voiceStop || !voiceStatus) {
      return;
    }

    chatForm.addEventListener("submit", function (event) {
      event.preventDefault();
      sendTextMessage();
    });

    chatInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendTextMessage();
      }
    });

    voiceStart.addEventListener("click", function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setVoiceStatus("Браузер не поддерживает запись с микрофона.", true);
        return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
          activeStream = stream;
          recorderChunks = [];

          try {
            recorder = new MediaRecorder(stream);
          } catch (error) {
            setVoiceStatus("Не удалось запустить запись: " + error.message, true);
            releaseActiveStream();
            return;
          }

          recorder.addEventListener("dataavailable", function (event) {
            if (event.data && event.data.size > 0) {
              recorderChunks.push(event.data);
            }
          });

          recorder.addEventListener("stop", function () {
            if (!recorderChunks.length) {
              setVoiceStatus("Голосовое сообщение пустое.", true);
              releaseActiveStream();
              return;
            }

            var voiceBlob = new Blob(recorderChunks, { type: "audio/webm" });
            addVoiceMessage(voiceBlob, "user");
            setVoiceStatus("Голосовое сообщение добавлено в чат.", false);
            scheduleAuthorReply("голосовое сообщение");
            releaseActiveStream();
          });

          recorder.start();
          setVoiceStatus("Идет запись... Нажмите «Стоп», когда закончите.", false);
          voiceStart.disabled = true;
          voiceStop.disabled = false;
        })
        .catch(function (error) {
          setVoiceStatus("Нет доступа к микрофону: " + error.message, true);
          voiceStart.disabled = false;
          voiceStop.disabled = true;
        });
    });

    voiceStop.addEventListener("click", function () {
      if (!recorder || recorder.state !== "recording") {
        setVoiceStatus("Сначала начните запись.", true);
        voiceStart.disabled = false;
        voiceStop.disabled = true;
        return;
      }

      recorder.stop();
      voiceStart.disabled = false;
      voiceStop.disabled = true;
    });
  }

  initMap();
  initChat();
};
