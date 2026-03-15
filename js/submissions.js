window.onload = function () {
  var submissionsList = document.getElementById("submissions-list");
  var saveStatus = document.getElementById("save-status");
  var params = new URLSearchParams(window.location.search);

  function createText(tagName, text, className) {
    var element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    element.textContent = text;
    return element;
  }

  function renderStatus() {
    if (!params.get("saved")) {
      return;
    }

    var banner = createText("div", "Сообщение успешно сохранено в MongoDB.", "status-banner");
    saveStatus.appendChild(banner);
  }

  function formatDate(value) {
    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Дата неизвестна";
    }

    return date.toLocaleString("ru-RU");
  }

  function renderSubmissions(items) {
    submissionsList.innerHTML = "";

    if (!items.length) {
      submissionsList.appendChild(createText("p", "Пока нет сохранённых сообщений.", "submissions-empty"));
      return;
    }

    items.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "submission-card";

      var title = createText("h3", item.name + " — " + item.topicLabel, "submission-title");
      var meta = document.createElement("p");
      meta.className = "submission-meta";
      meta.appendChild(createText("strong", "Email:"));
      meta.appendChild(document.createTextNode(" " + item.email + " | "));
      meta.appendChild(createText("strong", "Телефон:"));
      meta.appendChild(document.createTextNode(" " + (item.phone || "не указан") + " | "));
      meta.appendChild(createText("strong", "Связь:"));
      meta.appendChild(document.createTextNode(" " + item.contact + " | "));
      meta.appendChild(createText("strong", "Отправлено:"));
      meta.appendChild(document.createTextNode(" " + formatDate(item.createdAt)));

      var message = createText("p", item.message, "submission-message");

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(message);
      submissionsList.appendChild(card);
    });
  }

  function renderError(message) {
    submissionsList.innerHTML = "";
    submissionsList.appendChild(createText("p", message, "submissions-error"));
  }

  renderStatus();

  fetch("/api/submissions")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Не удалось получить список сообщений.");
      }

      return response.json();
    })
    .then(function (items) {
      renderSubmissions(items);
    })
    .catch(function (error) {
      renderError(error.message);
    });
};
