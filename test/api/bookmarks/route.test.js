import { expect } from "chai";
import {
  handleCreateBookmark,
  handleDeleteBookmark,
  handleGetBookmarks,
} from "../../../src/app/api/bookmarks/route.js";

function createSupabaseMock({
  user = { id: "user-123" },
  userError = null,
  selectData = [],
  selectError = null,
  insertData = null,
  insertError = null,
  deleteError = null,
} = {}) {
  const state = {
    eqCalls: [],
    insertedPayload: null,
    matchedPayload: null,
  };

  const queryChain = {
    eq(field, value) {
      state.eqCalls.push([field, value]);
      return this;
    },
    order() {
      return Promise.resolve({ data: selectData, error: selectError });
    },
  };

  const supabase = {
    auth: {
      getUser: async () => ({
        data: { user },
        error: userError,
      }),
    },
    from: () => ({
      select: () => queryChain,
      insert: (payload) => {
        state.insertedPayload = payload;
        return {
          select: () => ({
            single: async () => ({ data: insertData, error: insertError }),
          }),
        };
      },
      delete: () => ({
        match: async (payload) => {
          state.matchedPayload = payload;
          return { error: deleteError };
        },
      }),
    }),
    __state: state,
  };

  return supabase;
}

describe("/api/bookmarks route handlers", () => {
  it("GET returns 401 when unauthenticated", async () => {
    const supabase = createSupabaseMock({ user: null });
    const response = await handleGetBookmarks(
      { url: "http://localhost/api/bookmarks?resourceType=video" },
      supabase,
    );

    expect(response.status).to.equal(401);
    expect(await response.json()).to.deep.equal({ error: "Unauthorized" });
  });

  it("GET loads bookmarks scoped to authenticated user and resource type", async () => {
    const rows = [{ id: 1, user_id: "user-123", resource_type: "video" }];
    const supabase = createSupabaseMock({ selectData: rows });
    const response = await handleGetBookmarks(
      { url: "http://localhost/api/bookmarks?resourceType=video" },
      supabase,
    );

    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal(rows);
    expect(supabase.__state.eqCalls).to.deep.include(["user_id", "user-123"]);
    expect(supabase.__state.eqCalls).to.deep.include(["resource_type", "video"]);
  });

  it("POST returns 401 when unauthenticated", async () => {
    const supabase = createSupabaseMock({ user: null });
    const response = await handleCreateBookmark(
      {
        json: async () => ({ resourceType: "video", resourceId: "abc" }),
      },
      supabase,
    );

    expect(response.status).to.equal(401);
    expect(await response.json()).to.deep.equal({ error: "Unauthorized" });
  });

  it("POST derives user_id from session and ignores client user_id", async () => {
    const inserted = { id: 42, user_id: "user-123", resource_id: "abc" };
    const supabase = createSupabaseMock({ insertData: inserted });
    const response = await handleCreateBookmark(
      {
        json: async () => ({
          user_id: "malicious-user",
          resourceType: "video",
          resourceId: "abc",
          title: "Bookmark me",
        }),
      },
      supabase,
    );

    expect(response.status).to.equal(201);
    expect(await response.json()).to.deep.equal(inserted);
    expect(supabase.__state.insertedPayload.user_id).to.equal("user-123");
    expect(supabase.__state.insertedPayload.user_id).to.not.equal("malicious-user");
  });

  it("DELETE returns 401 when unauthenticated", async () => {
    const supabase = createSupabaseMock({ user: null });
    const response = await handleDeleteBookmark(
      {
        json: async () => ({ resourceType: "video", resourceId: "abc" }),
      },
      supabase,
    );

    expect(response.status).to.equal(401);
    expect(await response.json()).to.deep.equal({ error: "Unauthorized" });
  });

  it("DELETE scopes deletion to authenticated user id", async () => {
    const supabase = createSupabaseMock();
    const response = await handleDeleteBookmark(
      {
        json: async () => ({
          user_id: "malicious-user",
          resourceType: "video",
          resourceId: "abc",
        }),
      },
      supabase,
    );

    expect(response.status).to.equal(204);
    expect(supabase.__state.matchedPayload).to.deep.equal({
      user_id: "user-123",
      resource_type: "video",
      resource_id: "abc",
    });
  });

  it("DELETE accepts resource identifiers from query params", async () => {
    const supabase = createSupabaseMock();
    const response = await handleDeleteBookmark(
      {
        url: "http://localhost/api/bookmarks?resourceType=video&resourceId=from-query",
        json: async () => {
          throw new Error("body should not be required");
        },
      },
      supabase,
    );

    expect(response.status).to.equal(204);
    expect(supabase.__state.matchedPayload).to.deep.equal({
      user_id: "user-123",
      resource_type: "video",
      resource_id: "from-query",
    });
  });
});
