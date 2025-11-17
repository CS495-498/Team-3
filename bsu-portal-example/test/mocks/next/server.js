export const NextResponse = {
  json(body, init = {}) {
    return {
      status: init.status ?? 200,
      async json() {
        return body;
      }
    };
  }
};
