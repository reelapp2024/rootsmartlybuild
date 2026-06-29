
import { useSchemaMarkup } from '@/hooks/useSchemaMarkup';
import { generateHowToSchema } from '../utils/schemaGenerator';

const ProcessSchemaMarkup = () => {
  const howToSchema = generateHowToSchema({
    name: "How Our Plumbing Service Process Works",
    description: "Our streamlined 6-step process ensures professional plumbing service from start to finish",
    steps: [
      {
        name: "Initial Inspection",
        text: "Our team will conduct a thorough inspection of your plumbing system to identify any issues or potential problems.",
        position: 1
      },
      {
        name: "Quotation",
        text: "We will provide you with a detailed quotation outlining the cost of the required plumbing services.",
        position: 2
      },
      {
        name: "Scheduling",
        text: "Once you approve the quotation, we will schedule a convenient time to start the plumbing work.",
        position: 3
      },
      {
        name: "Repairs or Installation",
        text: "Our experienced plumbers will carry out the necessary repairs or installations with precision and efficiency.",
        position: 4
      },
      {
        name: "Quality Check",
        text: "After completing the plumbing work, we will perform a quality check to ensure everything is functioning properly.",
        position: 5
      },
      {
        name: "Clean-Up",
        text: "We will clean up the work area and leave your property in a tidy condition after completing the job.",
        position: 6
      }
    ]
  });

  useSchemaMarkup(howToSchema, 'plumbing-process');

  return null;
};

export default ProcessSchemaMarkup;
