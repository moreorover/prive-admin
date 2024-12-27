import { faker } from "@faker-js/faker";

faker.seed(628533);

export const customers = [
  {
    customer: {
      name: faker.person.fullName(),
    },
  },
  {
    customer: {
      name: faker.person.fullName(),
    },
  },
  {
    customer: {
      name: faker.person.fullName(),
    },
  },
];

const sizes = ["250ml", "500ml", "50g", "100g", "1L"];

export const products = [
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      variants: [
        {
          size: faker.helpers.arrayElement(sizes),
          price: faker.number.int({ min: 5, max: 200 }),
          stock: faker.number.int({ min: 0, max: 100 }),
        },
        {
          size: faker.helpers.arrayElement(sizes),
          price: faker.number.int({ min: 5, max: 200 }),
          stock: faker.number.int({ min: 0, max: 100 }),
        },
      ],
    },
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      variants: [
        {
          size: faker.helpers.arrayElement(sizes),
          price: faker.number.int({ min: 5, max: 200 }),
          stock: faker.number.int({ min: 0, max: 100 }),
        },
        {
          size: faker.helpers.arrayElement(sizes),
          price: faker.number.int({ min: 5, max: 200 }),
          stock: faker.number.int({ min: 0, max: 100 }),
        },
      ],
    },
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      variants: [
        {
          size: faker.helpers.arrayElement(sizes),
          price: faker.number.int({ min: 5, max: 200 }),
          stock: faker.number.int({ min: 0, max: 100 }),
        },
        {
          size: faker.helpers.arrayElement(sizes),
          price: faker.number.int({ min: 5, max: 200 }),
          stock: faker.number.int({ min: 0, max: 100 }),
        },
      ],
    },
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      variants: [
        {
          size: faker.helpers.arrayElement(sizes),
          price: faker.number.int({ min: 5, max: 200 }),
          stock: faker.number.int({ min: 0, max: 100 }),
        },
        {
          size: faker.helpers.arrayElement(sizes),
          price: faker.number.int({ min: 5, max: 200 }),
          stock: faker.number.int({ min: 0, max: 100 }),
        },
      ],
    },
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      variants: [
        {
          size: faker.helpers.arrayElement(sizes),
          price: faker.number.int({ min: 5, max: 200 }),
          stock: faker.number.int({ min: 0, max: 100 }),
        },
        {
          size: faker.helpers.arrayElement(sizes),
          price: faker.number.int({ min: 5, max: 200 }),
          stock: faker.number.int({ min: 0, max: 100 }),
        },
      ],
    },
  },
];
