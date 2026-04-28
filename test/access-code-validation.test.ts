import { isAccessCodeValidatedToday } from "../app/utils/access-code-validation";

describe("isAccessCodeValidatedToday", () => {
  test("keeps a previously verified access code valid for the same local day", () => {
    const validatedAt = new Date(2026, 3, 29, 8, 0, 0).getTime();
    const now = new Date(2026, 3, 29, 23, 59, 59).getTime();

    expect(isAccessCodeValidatedToday(validatedAt, now)).toBe(true);
  });

  test("requires a new server check on the next local day", () => {
    const validatedAt = new Date(2026, 3, 29, 23, 59, 59).getTime();
    const now = new Date(2026, 3, 30, 0, 0, 0).getTime();

    expect(isAccessCodeValidatedToday(validatedAt, now)).toBe(false);
  });

  test("does not treat empty validation time as valid", () => {
    expect(isAccessCodeValidatedToday(0, Date.now())).toBe(false);
  });
});
