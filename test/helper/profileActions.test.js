import { expect } from "chai";
import sinon from "sinon";

import {
    getUserAndProfile,
    updateProfile,
    switchPersona,
    createPersona,
    deleteAccount,
    deletePersona
} from "../../src/lib/profileActions.js";

describe("profileActions", () => {
    let supabase;

    beforeEach(() => {
        supabase = {
            auth: {
                getUser: sinon.stub(),
                getSession: sinon.stub(),
            },
            from: sinon.stub(),
        };
    });

    afterEach(() => {
        sinon.restore();
    });


    describe("deletePersona()", () => {
        let fetchStub;

        beforeEach(() => {
            fetchStub = sinon.stub(global, "fetch");
        });

        afterEach(() => {
            fetchStub.restore();
        });

        it("calls DELETE /api/personas/:id", async () => {
            fetchStub.resolves({
                ok: true,
            });

            await deletePersona("persona-1");

            expect(fetchStub.calledOnce).to.be.true;

            const [url, options] = fetchStub.firstCall.args;
            expect(url).to.equal("/api/personas/persona-1");
            expect(options.method).to.equal("DELETE");
        });

        it("throws if the request fails", async () => {
            fetchStub.resolves({
                ok: false,
            });

            try {
                await deletePersona("persona-1");
                throw new Error("Expected to throw");
            } catch (err) {
                expect(err.message).to.equal("Failed to delete persona");
            }
        });
    });

    describe("deleteAccount()", () => {
        let fetchStub;

        beforeEach(() => {
            fetchStub = sinon.stub(global, "fetch");
        });

        afterEach(() => {
            fetchStub.restore();
        });

        it("calls DELETE /api/profiles/me", async () => {
            fetchStub.resolves({
                ok: true,
            });

            await deleteAccount();

            expect(fetchStub.calledOnce).to.be.true;

            const [url, options] = fetchStub.firstCall.args;
            expect(url).to.equal("/api/profiles/me");
            expect(options.method).to.equal("DELETE");
        });

        it("throws if the request fails", async () => {
            fetchStub.resolves({
                ok: false,
            });

            try {
                await deleteAccount();
                throw new Error("Expected to throw");
            } catch (err) {
                expect(err.message).to.equal("Failed to delete account");
            }
        });
    });


    describe("getUserAndProfile()", () => {
        it("returns user, profile, personas, and activePersona", async () => {
            const user = { id: "user-1" };

            supabase.auth.getUser.resolves({ data: { user }, error: null });

            supabase.from.withArgs("profiles").returns({
                select: () => ({
                    eq: () => ({
                        single: () => ({
                            data: {
                                full_name: "Joe",
                                username: "joe",
                                avatar_url: "avatar.png",
                                active_persona_id: "persona-1",
                            },
                            error: null,
                        }),
                    }),
                }),
            });

            supabase.from.withArgs("personas").returns({
                select: () => ({
                    eq: () => ({
                        data: [
                            { id: "persona-1", full_name: "Alt Joe" },
                            { id: "persona-2", full_name: "Other Joe" },
                        ],
                        error: null,
                    }),
                }),
            });

            const result = await getUserAndProfile(supabase);

            expect(result.user).to.deep.equal(user);
            expect(result.profile.full_name).to.equal("Joe");
            expect(result.personas).to.have.length(2);
            expect(result.activePersona.id).to.equal("persona-1");
        });

        it("throws if no authenticated user", async () => {
            supabase.auth.getUser.resolves({
                data: { user: null },
                error: null,
            });

            try {
                await getUserAndProfile(supabase);
                throw new Error("Expected to throw");
            } catch (err) {
                expect(err.message).to.equal("No authenticated user");
            }
        });
    });



    describe("updateProfile()", () => {
        it("upserts trimmed profile values", async () => {
            const upsert = sinon.stub().resolves({ error: null });

            supabase.from.withArgs("profiles").returns({ upsert });

            await updateProfile(supabase, "user-1", {
                full_name: " Joe ",
                username: " joe ",
            });

            expect(upsert.calledOnce).to.be.true;

            const payload = upsert.firstCall.args[0];
            expect(payload.full_name).to.equal("Joe");
            expect(payload.username).to.equal("joe");
        });

        it("throws if Supabase returns an error", async () => {
            supabase.from.withArgs("profiles").returns({
                upsert: sinon.stub().resolves({ error: new Error("DB error") }),
            });

            try {
                await updateProfile(supabase, "user-1", {
                    full_name: "Joe",
                    username: "joe",
                });
                throw new Error("Expected to throw");
            } catch (err) {
                expect(err.message).to.equal("DB error");
            }
        });
    });



    describe("switchPersona()", () => {
        it("updates active_persona_id", async () => {
            const update = sinon.stub().returns({
                eq: sinon.stub().resolves({ error: null }),
            });

            supabase.from.withArgs("profiles").returns({ update });

            await switchPersona(supabase, "user-1", "persona-1");

            expect(update.calledOnce).to.be.true;
            expect(update.firstCall.args[0]).to.deep.equal({
                active_persona_id: "persona-1",
            });
        });

        it("throws on update error", async () => {
            supabase.from.withArgs("profiles").returns({
                update: () => ({
                    eq: sinon.stub().resolves({ error: new Error("Fail") }),
                }),
            });

            try {
                await switchPersona(supabase, "user-1", null);
                throw new Error("Expected to throw");
            } catch (err) {
                expect(err.message).to.equal("Fail");
            }
        });
    });


    describe("createPersona()", () => {
        it("creates persona and sets it active", async () => {
            supabase.from.withArgs("personas").returns({
                insert: () => ({
                    select: () => ({
                        single: () => ({
                            data: { id: "persona-1", full_name: "New Persona" },
                            error: null,
                        }),
                    }),
                }),
            });

            supabase.from.withArgs("profiles").returns({
                update: () => ({
                    eq: sinon.stub().resolves({ error: null }),
                }),
            });

            const persona = await createPersona(
                supabase,
                "user-1",
                " New Persona "
            );

            expect(persona.id).to.equal("persona-1");
            expect(persona.full_name).to.equal("New Persona");
        });

        it("throws if persona name is empty", async () => {
            try {
                await createPersona(supabase, "user-1", "   ");
                throw new Error("Expected to throw");
            } catch (err) {
                expect(err.message).to.equal("Persona name cannot be empty");
            }
        });
    });
});
