import { onRequestPost as __api_space__userId__assets_ts_onRequestPost } from "/Users/yujiaqi/Documents/workspace/my-github/vbsite/functions/api/space/[userId]/assets.ts"
import { onRequestPut as __api_space__userId__publish_ts_onRequestPut } from "/Users/yujiaqi/Documents/workspace/my-github/vbsite/functions/api/space/[userId]/publish.ts"
import { onRequestPost as __api_admin_edit_link_ts_onRequestPost } from "/Users/yujiaqi/Documents/workspace/my-github/vbsite/functions/api/admin/edit-link.ts"
import { onRequestPost as __api_admin_login_ts_onRequestPost } from "/Users/yujiaqi/Documents/workspace/my-github/vbsite/functions/api/admin/login.ts"
import { onRequestPost as __api_admin_logout_ts_onRequestPost } from "/Users/yujiaqi/Documents/workspace/my-github/vbsite/functions/api/admin/logout.ts"
import { onRequestGet as __api_admin_session_ts_onRequestGet } from "/Users/yujiaqi/Documents/workspace/my-github/vbsite/functions/api/admin/session.ts"
import { onRequestGet as __api_admin_users_ts_onRequestGet } from "/Users/yujiaqi/Documents/workspace/my-github/vbsite/functions/api/admin/users.ts"
import { onRequestGet as __api_space__userId__ts_onRequestGet } from "/Users/yujiaqi/Documents/workspace/my-github/vbsite/functions/api/space/[userId].ts"

export const routes = [
    {
      routePath: "/api/space/:userId/assets",
      mountPath: "/api/space/:userId",
      method: "POST",
      middlewares: [],
      modules: [__api_space__userId__assets_ts_onRequestPost],
    },
  {
      routePath: "/api/space/:userId/publish",
      mountPath: "/api/space/:userId",
      method: "PUT",
      middlewares: [],
      modules: [__api_space__userId__publish_ts_onRequestPut],
    },
  {
      routePath: "/api/admin/edit-link",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_edit_link_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/login",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_login_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/logout",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_logout_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/session",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_session_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/users",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_users_ts_onRequestGet],
    },
  {
      routePath: "/api/space/:userId",
      mountPath: "/api/space",
      method: "GET",
      middlewares: [],
      modules: [__api_space__userId__ts_onRequestGet],
    },
  ]