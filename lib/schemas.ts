import { z } from "zod";

export const EmployeeSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required." }),
  last_name: z.string().min(1, { message: "Last name is required." }),
  // Coerce will attempt to convert the string from the form into a number
  rate_per_hour: z.coerce
    .number({ invalid_type_error: "Rate must be a number." })
    .positive({ message: "Rate must be a positive number." })
    .optional()
    .or(z.literal('')), // Allows the field to be empty
});