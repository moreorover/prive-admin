import { faker } from "@faker-js/faker";

faker.seed(410149);

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

function generateUniqueVariants(variantCount: number) {
  const uniqueCount = Math.min(sizes.length, variantCount); // Ensure we don't exceed available sizes
  const selectedSizes = faker.helpers.arrayElements(sizes, uniqueCount);
  return selectedSizes.map((size) => ({
    size,
    price: faker.number.int({ min: 500, max: 20000 }),
    stock: faker.number.int({ min: 0, max: 100 }),
  }));
}

export const products = [
  {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    variants: generateUniqueVariants(2),
  },
  {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    variants: generateUniqueVariants(3),
  },
  {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    variants: generateUniqueVariants(1),
  },
  {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    variants: generateUniqueVariants(2),
  },
  {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    variants: generateUniqueVariants(3),
  },
];

const transactionName = ["Booking Fee", "Payment"];

const generateTransactions = (count: number) => {
  return Array.from({ length: count }).map(() => {
    const amount = faker.number.float({
      min: 50,
      max: 800,
      multipleOf: 0.25,
    });
    return {
      name: faker.helpers.arrayElement(transactionName),
      amount,
      allocations: generateTransactionAllocations(amount),
    };
  });
};

const generateTransactionAllocations = (
  amount: number,
  minAllocations = 1,
  maxAllocations = 3,
) => {
  const allocations: { amount: number }[] = [];

  const allocationCount = faker.number.int({
    min: minAllocations,
    max: maxAllocations,
  });
  let remainingAmount = amount;

  for (let i = 0; i < allocationCount; i++) {
    // Ensure the last allocation takes the remaining amount
    const isLastAllocation = i === allocationCount - 1;
    const allocationAmount = isLastAllocation
      ? remainingAmount
      : faker.number.float({
          min: 1,
          max: Math.max(1, remainingAmount - (allocationCount - i - 1)),
          multipleOf: 0.25,
        });

    allocations.push({
      amount: allocationAmount,
    });

    remainingAmount -= allocationAmount;

    if (remainingAmount <= 0) break; // Prevent unnecessary allocations
  }

  return allocations;
};

export const transactions = generateTransactions(20);
