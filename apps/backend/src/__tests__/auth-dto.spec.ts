import "reflect-metadata";
import { describe, it, expect } from "@jest/globals";
import { validate } from "class-validator";
import { RegisterDto, LoginDto, RefreshDto } from "../auth/dto/auth.dto.js";

function makeRegister(overrides?: Partial<RegisterDto>): RegisterDto {
  const dto = new RegisterDto();
  Object.assign(dto, {
    email: "a@b.com",
    password: "twelveChars123",
    name: "A",
    ...overrides,
  });
  return dto;
}

const PIPE_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
  forbidUnknownValues: true,
};

describe("Auth DTO validation (SEC-12 password policy + input validation)", () => {
  it("11-character password is rejected by server-side DTO validation", async () => {
    const dto = makeRegister({ password: "only11chars" });
    const errors = await validate(dto, PIPE_OPTIONS);
    const passwordError = errors.find((e) => e.property === "password");
    expect(passwordError).toBeDefined();
  });

  it("12-character password passes server-side DTO validation", async () => {
    const dto = makeRegister({ password: "twelveChars123" });
    const errors = await validate(dto, PIPE_OPTIONS);
    expect(errors).toHaveLength(0);
  });

  it("register DTO safely rejects privileged role and organizationId fields", async () => {
    const dto = new RegisterDto();
    Object.assign(dto, {
      email: "a@b.com",
      password: "twelveChars123",
      name: "A",
      role: "admin",
      organizationId: "default-org",
    });
    const errors = await validate(dto, PIPE_OPTIONS);
    expect(errors.some((e) => e.property === "role")).toBe(true);
    expect(errors.some((e) => e.property === "organizationId")).toBe(true);
  });

  it("passwords shorter than 12 chars are always rejected (multi-length)", async () => {
    for (const pwd of ["short", "12345678901"]) {
      const dto = makeRegister({ password: pwd });
      const errors = await validate(dto, PIPE_OPTIONS);
      const passwordError = errors.find((e) => e.property === "password");
      expect(passwordError).toBeDefined();
    }
  });

  it("login DTO requires a valid email and non-empty password", async () => {
    const dto = new LoginDto();
    Object.assign(dto, { email: "not-an-email", password: "" });
    const errors = await validate(dto, PIPE_OPTIONS);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("refresh DTO requires refresh_token", async () => {
    const dto = new RefreshDto();
    const errors = await validate(dto, PIPE_OPTIONS);
    expect(errors.length).toBeGreaterThan(0);
  });
});
