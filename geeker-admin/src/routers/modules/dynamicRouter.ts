import router from "@/routers/index";
import { LOGIN_URL } from "@/config";
import { RouteRecordRaw } from "vue-router";
import { ElNotification } from "element-plus";
import { useUserStore } from "@/stores/modules/user";
import { useAuthStore } from "@/stores/modules/auth";

// 引入 views 文件夹下所有 vue 文件
const modules = import.meta.glob("@/views/**/*.vue");

function normalizeRedirectWithParams(item: any) {
  if (!item?.redirect || typeof item.redirect !== "string") return;
  if (!item.redirect.includes("/:")) return;
  const redirectTemplate: string = item.redirect;
  item.redirect = (to: any) => {
    let path = redirectTemplate;
    const params = to?.params || {};
    Object.keys(params).forEach(key => {
      const v = Array.isArray(params[key]) ? params[key][0] : params[key];
      path = path.replaceAll(`:${key}`, encodeURIComponent(String(v)));
    });
    if (path.includes("/project/detail/:id")) {
      const id = String(params.id || (to?.path ? to.path.match(/\/project\/detail\/([^/]+)/)?.[1] : "") || "");
      if (id) {
        path = path.replace("/project/detail/:id", `/project/detail/${encodeURIComponent(id)}`);
      } else {
        return "/project/list";
      }
    }
    if (path.includes("/:")) {
      return "/project/list";
    }
    return path;
  };
}

/**
 * @description 初始化动态路由
 */
export const initDynamicRouter = async () => {
  const userStore = useUserStore();
  const authStore = useAuthStore();

  try {
    // 1.获取菜单列表 && 按钮权限列表
    await authStore.getAuthMenuList();
    await authStore.getAuthButtonList();

    // 2.判断当前用户有没有菜单权限
    if (!authStore.authMenuListGet.length) {
      ElNotification({
        title: "无权限访问",
        message: "当前账号无任何菜单权限，请联系系统管理员！",
        type: "warning",
        duration: 3000
      });
      userStore.setToken("");
      router.replace(LOGIN_URL);
      return Promise.reject("No permission");
    }

    // 3.添加动态路由
    authStore.flatMenuListGet.forEach(item => {
      item.children && delete item.children;
      if (item.component && typeof item.component == "string") {
        item.component = modules["/src/views" + item.component + ".vue"];
      }
      normalizeRedirectWithParams(item);
      if (item.meta.isFull) {
        router.addRoute(item as unknown as RouteRecordRaw);
      } else {
        router.addRoute("layout", item as unknown as RouteRecordRaw);
      }
    });
  } catch (error) {
    // 当按钮 || 菜单请求出错时，重定向到登陆页
    userStore.setToken("");
    router.replace(LOGIN_URL);
    return Promise.reject(error);
  }
};
