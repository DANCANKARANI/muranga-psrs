import { prisma } from "@/lib/prisma";

function isMissingSettingsTable(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2021";
}

export async function getSlaDays(): Promise<number> {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: "slaDays" }, select: { value: true } });
    const value = Number(setting?.value ?? "3");
    return Number.isInteger(value) && value > 0 ? value : 3;
  } catch (error) {
    if (isMissingSettingsTable(error)) return 3;
    throw error;
  }
}

export { isMissingSettingsTable };
