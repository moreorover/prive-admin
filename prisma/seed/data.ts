import { faker } from "@faker-js/faker";

faker.seed(628533);

export const deviceBrands = [{ name: "Dahua" }, { name: "Raspberry Pi" }];

export const deviceTypes = [
  { name: "Controller" },
  { name: "Network Video Recorder" },
  { name: "CCTV Camera" },
  { name: "Detector" },
  { name: "Light Strip" },
];

export const customers = [
  { name: faker.person.fullName() },
  { name: faker.person.fullName() },
  { name: faker.person.fullName() },
  { name: faker.person.fullName() },
];

export const locations = [
  { address: faker.location.streetAddress() },
  { address: faker.location.streetAddress() },
  { address: faker.location.streetAddress() },
  { address: faker.location.streetAddress() },
  { address: faker.location.streetAddress() },
  { address: faker.location.streetAddress() },
];
