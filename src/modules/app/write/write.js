import { LightningElement, track } from "lwc";

const ENDPOINT_ARTICLES =
  "https://shruti-df22-dev-ed.develop.my.salesforce-sites.com/services/apexrest/medium/api/";
const CONTENT_CHARS_DISPLAYED = 180;

export default class Write extends LightningElement {
  articles = [];

  editedArticle = {};
  editResponse = {};

  timerId;

  newArticle = {
    Title__c: null,
    Content__c: null,
  };
  newResponse = {};

  @track appStatus = {
    isBusy: false,
    hasErrors: false,
    message: null,
  };

  //GETTERS
  get paramNew() {
    return new URL(location.href).searchParams.get("new");
  }

  get paramEdit() {
    return new URL(location.href).searchParams.get("edit");
  }

  get paramSlug() {
    return new URL(location.href).searchParams.get("slug");
  }

  get isListMode() {
    if (!this.paramNew && !this.paramEdit) {
      return true;
    }

    return false;
  }

  get isEditMode() {
    if (this.paramEdit) {
      return true;
    }

    return false;
  }

  get isComposeMode() {
    if (this.paramNew) {
      return true;
    }

    return false;
  }

  //LIFECYCLE HOOKS
  connectedCallback() {
    if (this.isListMode) {
      this.fetchAllArticles();
    }

    if (this.isEditMode) {
      this.fetchArticleBySlug();
    }

    this.handleWindowMessage();
  }

  //EVENT HANDLERS
  handleWindowMessage() {
    const handler = function (event) {
      const data = event.data;
      if (data.action === "save") {
        if (this.isComposeMode) {
          this.newArticle.Title__c =
            this.template.querySelector(".input-title").value;
          this.newArticle.Content__c = data.payload;
          this.createArticle();
        }
        if (this.isEditMode) {
          this.editedArticle.Content__c = data.payload;
          this.updateArticleBySlug();
        }
      }

      if (data.action === "load") {
        window.clearInterval(this.timerId);
      }
    }.bind(this);

    window.addEventListener("message", handler);
  }

  handleEditClick(event) {
    location.href = `/write?slug=${event.target.dataset.slug}&edit=1`;
  }

  handleComposeClick(event) {
    location.href = `/write?new=1`;
  }

  //API ACTIONS
  async fetchAllArticles() {
    try {
      this.setBusy(true);

      const fetchResponse = await fetch(ENDPOINT_ARTICLES);

      this.setBusy(false);

      if (!fetchResponse.ok) {
        const text = await fetchResponse.text();
        this.showError(text);
        return;
      }

      const apiResponse = await fetchResponse.json();
      if (!apiResponse.success) {
        this.showError(apiResponse.message);
        return;
      }

      this.articles = apiResponse.data.map((article) => {
        const clonedArticle = { ...article };

        clonedArticle.Content__c =
          clonedArticle.Content__c.substring(0, CONTENT_CHARS_DISPLAYED) +
          "...";

        return clonedArticle;
      });
    } catch (e) {
      this.showError(e.message);
    }
  }

  async fetchArticleBySlug() {
    try {
      this.setBusy(true);

      const fetchResponse = await fetch(
        `${ENDPOINT_ARTICLES}?slug=${this.paramSlug}`
      );

      this.setBusy(false);

      if (!fetchResponse.ok) {
        const text = await fetchResponse.text();
        this.showError(text);
        return;
      }

      const apiResponse = await fetchResponse.json();
      if (!apiResponse.success) {
        this.showError(apiResponse.message);
        return;
      }

      this.editedArticle = apiResponse.data[0];

      this.timerId = window.setInterval(() => {
        this.template
          .querySelector(".editor")
          .contentWindow.postMessage(this.editedArticle);
      }, 1000);
    } catch (e) {
      this.showError(e.message);
    }
  }

  async updateArticleBySlug() {
    try {
      this.setBusy(true);

      const fetchResponse = await fetch(ENDPOINT_ARTICLES, {
        headers: {
          "Content-type": "application/json",
        },
        method: "PATCH",
        body: JSON.stringify({
          slug: this.paramSlug,
          content: this.editedArticle.Content__c,
        }),
      });

      this.setBusy(false);

      if (!fetchResponse.ok) {
        const text = await fetchResponse.text();
        this.showError(text);
        return;
      }

      const apiResponse = await fetchResponse.json();
      if (!apiResponse.success) {
        this.showError(apiResponse.message);
        return;
      }

      this.editResponse = apiResponse;
      window.setTimeout(() => {
        this.editResponse = {};
      }, 2000);
    } catch (e) {
      this.showError(e.message);
    }
  }

  async createArticle() {
    try {
      this.setBusy(true);

      const fetchResponse = await fetch(ENDPOINT_ARTICLES, {
        headers: {
          "Content-type": "application/json",
        },
        method: "PUT",
        body: JSON.stringify({
          title: this.newArticle.Title__c,
          content: this.newArticle.Content__c,
        }),
      });

      this.setBusy(false);

      if (!fetchResponse.ok) {
        const text = await fetchResponse.text();
        this.showError(text);
        return;
      }

      const apiResponse = await fetchResponse.json();
      if (!apiResponse.success) {
        this.showError(apiResponse.message);
        return;
      }

      this.newResponse = apiResponse;
      window.setTimeout(() => {
        this.newResponse = {};
        location.href = `/write?slug=${apiResponse.data[0].Slug__c}&edit=1`;
      }, 1000);
    } catch (e) {
      this.showError(e.message);
    }
  }

  //HELPERS
  setBusy(isBusy) {
    this.appStatus = {
      isBusy: isBusy,
      hasErrors: false,
      message: null,
    };
  }

  showError(message) {
    this.appStatus = {
      isBusy: false,
      hasErrors: true,
      message: message,
    };
  }
}
