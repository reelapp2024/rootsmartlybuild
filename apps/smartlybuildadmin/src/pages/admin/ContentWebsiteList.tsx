import { ProjectList } from "@/components/admin/ProjectList";

export default function ContentWebsiteList() {
  return (
    <ProjectList
      projectType={2}
      moduleTitle="Content Websites"
      moduleDescription="Manage Pinterest / content automation websites"
      createRoute="/admin/content-websites/create"
      createButtonLabel="Create Content Website"
      searchPlaceholder="Search content websites..."
    />
  );
}
