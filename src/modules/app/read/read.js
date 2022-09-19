import { LightningElement, track } from "lwc";

const ENDPOINT_ARTICLES =
  "https://shruti-df22-dev-ed.develop.my.salesforce-sites.com/services/apexrest/medium/api/";
const CONTENT_CHARS_DISPLAYED = 180;

export default class Read extends LightningElement {
  articles = [];
  article = {};

  @track appStatus = {
    isBusy: false,
    hasErrors: false,
    message: null,
  };

  //GETTERS
  get paramSlug() {
    return new URL(location.href).searchParams.get("slug");
  }

  get isListMode() {
    if (!this.paramSlug) {
      return true;
    }

    return false;
  }

  get isDetailMode() {
    if (this.paramSlug) {
      return true;
    }

    return false;
  }

  //LIFECYCLE HOOKS
  connectedCallback() {
    if (this.isListMode) {
      this.fetchAllArticles();
    }

    if (this.isDetailMode) {
      this.fetchArticleBySlug();
    }
  }

  //EVENT HANDLERS
  handleReadMoreClick(event) {
    location.href = `/read?slug=${event.target.dataset.slug}`;
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

      this.article = apiResponse.data[0];
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
