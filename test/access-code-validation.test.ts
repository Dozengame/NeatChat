import {
  getAccessCodeValidationServerId,
  isAccessCodeValidatedToday,
  isAccessCodeValidationCurrent,
} from "../app/utils/access-code-validation";

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

  test("keeps validation valid only for the same server config", () => {
    const serverConfig = {
      deploymentId: "dpl_1",
      configVersion: "v1",
      configHash: "hash-1",
    };
    const validatedServerId = getAccessCodeValidationServerId(serverConfig);

    expect(
      isAccessCodeValidationCurrent({
        accessCode: "code",
        validatedAccessCode: "code",
        accessCodeValidatedAt: new Date(2026, 3, 29, 8).getTime(),
        accessCodeValidatedServerId: validatedServerId,
        serverConfig,
        now: new Date(2026, 3, 29, 12).getTime(),
      }),
    ).toBe(true);
  });

  test("requires a new server check after a new deployment", () => {
    const oldServerConfig = {
      deploymentId: "dpl_1",
      configVersion: "v1",
      configHash: "hash-1",
    };

    expect(
      isAccessCodeValidationCurrent({
        accessCode: "code",
        validatedAccessCode: "code",
        accessCodeValidatedAt: new Date(2026, 3, 29, 8).getTime(),
        accessCodeValidatedServerId:
          getAccessCodeValidationServerId(oldServerConfig),
        serverConfig: {
          ...oldServerConfig,
          deploymentId: "dpl_2",
        },
        now: new Date(2026, 3, 29, 12).getTime(),
      }),
    ).toBe(false);
  });
});
