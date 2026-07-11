import {
  getAccessRestrictedPublicErrorMessage,
  isAccessRestrictedPublicError,
} from "../app/utils/public-error";

describe("public API error localization", () => {
  test("identifies the stable access restriction code", () => {
    expect(
      isAccessRestrictedPublicError({
        error: true,
        code: "access_restricted",
      }),
    ).toBe(true);
    expect(isAccessRestrictedPublicError({ error: true, msg: "other" })).toBe(
      false,
    );
  });

  test("maps a restricted HTTP response to localized copy", () => {
    const response = { status: 429 } as Response;
    const payload = {
      code: "access_restricted",
      msg: "access_restricted",
    };

    expect(
      getAccessRestrictedPublicErrorMessage({
        response,
        payload,
        message: "localized access restriction",
      }),
    ).toBe("localized access restriction");
  });

  test("does not replace unrelated provider errors", () => {
    expect(
      getAccessRestrictedPublicErrorMessage({
        response: { status: 400 },
        payload: { error: { message: "invalid request" } },
        message: "localized access restriction",
      }),
    ).toBeUndefined();
  });
});
