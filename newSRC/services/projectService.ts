import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { getData } from "../utils/storeData";

export type ProjectStatus = {
  id?: number | string;
  status_name?: string;
  color?: string;
};

export type ProjectItem = {
  id: number;
  project_name: string;
  project_image?: string;
  deadline?: string;
  project_status_data_api?: ProjectStatus;
};

export type ProjectLabel = {
  labels?: string;
  color_code?: string;
};

export type ProjectPerson = {
  display_name?: string;
  telefoon?: string;
  profile_img?: string;
};

export type ProjectActivity = {
  working_schedule?: string;
  working_schedule_days?: string;
  activity_data?: {
    activity_name?: string;
    activity_category_data?: {
      activities_category_name?: string;
    };
  };
};

export type ProjectTask = {
  title?: string;
  deadline?: string;
  priority?: string;
  relatie_data?: { display_name?: string };
  task_status_data?: ProjectStatus;
};

export type ProjectTicket = {
  id?: number;
  project_name?: string;
  ticket_title?: string;
  ticketstatus?: ProjectStatus;
  action_relatie_data?: { display_name?: string };
  gmaps_working_address?: string;
};

export type ProjectDetail = {
  id?: number;
  project_name?: string;
  project_image?: string;
  deadline?: string;
  gmaps_working_address?: string;
  project_status_data_api?: ProjectStatus;
  project_labels_data_api?: ProjectLabel[];
  relaties_owners?: ProjectPerson[];
  connected_relaties?: ProjectPerson[];
  relaties_members?: ProjectPerson[];
  project_activity?: ProjectActivity[];
  task_data?: ProjectTask[];
  ticket_data?: ProjectTicket[];
};

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

export async function fetchProjects() {
  const ctx = await getUserContext();
  return ApiService<ProjectItem[]>(apiConstants.getprojects, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
    },
  });
}

export async function fetchProjectStatuses() {
  const ctx = await getUserContext();
  return ApiService<ProjectStatus[]>(apiConstants.getstatus, {
    includeToken: true,
    customData: {
      slug: "project",
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });
}

export async function fetchProjectDetails(projectId: string | number) {
  const ctx = await getUserContext();
  return ApiService<ProjectDetail[]>(apiConstants.get_project_details, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
      project_id: projectId,
    },
  });
}
