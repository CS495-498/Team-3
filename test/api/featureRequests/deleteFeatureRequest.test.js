import { expect } from "chai";
import { handleDelete } from "../../../src/app/api/feature-requests/[id]/route.js";

function createDeleteQueryMock({ data = [{ id: "req-1" }], error = null } = {}) {
  const state = {
    eqCalls: [],
  };

  const query = {
    eq(field, value) {
      state.eqCalls.push([field, value]);
      return this;
    },
    async select() {
      return { data, error };
    },
  };

  return { query, state };
}

describe("DELETE /api/feature-requests/[id]", () => {
  it("allows non-admin users to delete their own feature requests", async () => {
    const { query, state } = createDeleteQueryMock();
    const supabase = {
      from() {
        return {
          delete() {
            return query;
          },
        };
      },
    };

    const response = await handleDelete(
      { method: "DELETE", url: "http://localhost/api/feature-requests/req-1" },
      {
        params: { id: "req-1" },
      },
      {
        createClientFn: async () => supabase,
        requireAuthWithPermissionFn: async () => ({
          error: null,
          profile: { id: "user-1", role: "contentstack" },
        }),
      }
    );

    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ success: true });
    expect(state.eqCalls).to.deep.equal([
      ["id", "req-1"],
      ["user_id", "user-1"],
    ]);
  });

  it("allows admins to delete any feature request", async () => {
    const { query, state } = createDeleteQueryMock();
    const supabase = {
      from() {
        return {
          delete() {
            return query;
          },
        };
      },
    };

    const response = await handleDelete(
      { method: "DELETE", url: "http://localhost/api/feature-requests/req-1" },
      {
        params: { id: "req-1" },
      },
      {
        createClientFn: async () => supabase,
        requireAuthWithPermissionFn: async () => ({
          error: null,
          profile: { id: "admin-1", role: "admin" },
        }),
      }
    );

    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ success: true });
    expect(state.eqCalls).to.deep.equal([["id", "req-1"]]);
  });
});
