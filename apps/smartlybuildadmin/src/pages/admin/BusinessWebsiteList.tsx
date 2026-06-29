import { ProjectList } from "@/components/admin/ProjectList";

export default function BusinessWebsiteList() {
  return (
    <ProjectList
      projectType={1}
      moduleTitle="Business Websites"
      moduleDescription="Manage and monitor your business websites"
      createRoute="/admin/business-website/create"
      createButtonLabel="Create Business Website"
      searchPlaceholder="Search business websites..."
    />
  );
}
