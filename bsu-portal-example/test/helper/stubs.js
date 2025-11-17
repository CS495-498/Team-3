import sinon from "sinon";

/** Stubs global fetch with a canned response */
export function stubFetch(response = {}, ok = true) {
  return sinon.stub(global, "fetch").resolves({
    ok,
    json: async () => response
  });
}

/** Creates a fake Supabase client */
export function stubSupabase(mockData) {
  return {
    from: () => ({
      select: () => ({ data: mockData, error: null }),
      insert: () => ({ data: mockData, error: null }),
      update: () => ({ data: mockData, error: null })
    })
  };
}

/** Creates a fake Contentstack SDK stack */
export function stubContentstack(entries = []) {
  return {
    ContentType: () => ({
      Query: () => ({
        toJSON: () => ({
          find: async () => [entries, {}] // Contentstack returns [result, schema]
        })
      }),
      Entry: () => ({
        toJSON: () => ({
          fetch: async () => ({ entry: entries[0] })
        })
      })
    })
  };
}
