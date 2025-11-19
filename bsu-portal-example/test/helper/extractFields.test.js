import { expect } from "chai";
import extractFields from "../../src/app/api/helper/extractFields.js";

describe("extractFields()", () => {
  it("extracts only specified fields", () => {
    const array = [
      {
        title: "Test Video",
        description: "Desc",
        extra_field: "SHOULD NOT APPEAR",
      },
    ];

    const result = extractFields(array, ["title", "description"]);

    expect(result[0]).to.deep.equal({
      title: "Test Video",
      description: "Desc",
    });
  });

  it("extracts asset UID when field is an object with .uid", () => {
    const array = [
      {
        video_file: { uid: "asset123" },
        thumbnail: { uid: "thumb789" },
      },
    ];

    const result = extractFields(array, ["video_file", "thumbnail"]);

    expect(result[0]).to.deep.equal({
      video_file: "asset123",
      thumbnail: "thumb789",
    });
  });

  it("keeps raw primitive values (string/number/etc)", () => {
    const array = [
      {
        title: "Hello",
        description: "World",
        se_name: "slug-123",
      },
    ];

    const result = extractFields(array, ["title", "description", "se_name"]);

    expect(result[0]).to.deep.equal({
      title: "Hello",
      description: "World",
      se_name: "slug-123",
    });
  });

  it("skips null, undefined, and empty-string fields", () => {
    const array = [
      {
        title: "Valid",
        description: null,
        se_name: "",
        thumbnail: undefined,
      },
    ];

    const result = extractFields(array, ["title", "description", "se_name", "thumbnail"]);

    expect(result[0]).to.deep.equal({
      title: "Valid",
    });
  });

  it("always includes date_posted if present", () => {
    const array = [
      {
        title: "Test",
        date_posted: "2025-01-01",
      },
    ];

    const result = extractFields(array, ["title"]);

    expect(result[0]).to.deep.equal({
      title: "Test",
      date_posted: "2025-01-01",
    });
  });

  it("supports multiple array elements", () => {
    const array = [
      { title: "A", video_file: { uid: "1" } },
      { title: "B", video_file: { uid: "2" } },
    ];

    const result = extractFields(array, ["title", "video_file"]);

    expect(result).to.deep.equal([
      { title: "A", video_file: "1" },
      { title: "B", video_file: "2" },
    ]);
  });

  it("does not mutate the original items", () => {
    const array = [
      { title: "Original", video_file: { uid: "abc" } },
    ];

    const originalCopy = JSON.parse(JSON.stringify(array));

    extractFields(array, ["title", "video_file"]);

    expect(array).to.deep.equal(originalCopy);
  });

  it("returns an empty object when no fields match", () => {
    const array = [{ something: "x", somethingElse: 123 }];

    const result = extractFields(array, ["title", "video_file"]);

    expect(result[0]).to.deep.equal({});
  });

    it("returns an empty array when input array is empty", () => {
    const array = [];
    const result = extractFields(array, ["title", "video_file"]);
    expect(result).to.deep.equal([]);
    });

});
