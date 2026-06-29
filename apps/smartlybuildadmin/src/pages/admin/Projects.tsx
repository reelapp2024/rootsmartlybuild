import { ProjectList } from "@/components/admin/ProjectList";

export default function Projects() {
  return (
    <ProjectList
      projectType={0}
      moduleTitle="Bulk Pages Websites"
      moduleDescription="Manage and monitor your bulk pages websites"
      createRoute="/admin/bulk-pages-websites/create"
      createButtonLabel="Create Bulk Pages Website"
      searchPlaceholder="Search bulk pages websites..."
    />
  );
}