# 招聘候选数据库

使用支持事务和角色权限的 PostgreSQL。云端集成测试使用 PostgreSQL 17，运行 `npm run test:db` 会启动无外部网络的临时 Docker 容器，自动应用迁移并验证候选、审核、发布和回退，结束后移除容器。

部署时由迁移账号应用 `001_candidate_batches.sql`，并使用受控数据库连接导入候选种子：

```sh
set -o pipefail
node tools/recruitment-import.mjs | psql -X -v ON_ERROR_STOP=1
```

使用环境已配置的 PostgreSQL 连接。脚本默认读取仓库中的两份种子，也接受候选文件及来源索引的路径。相同版本和内容重复导入会返回 false。内容有变动时必须使用新版本。

数据库默认不向 PUBLIC 开放该模式和操作。应用接入时，导入账号只需模式 USAGE 和导入函数执行权，审核操作账号只需模式 USAGE 和两项审核、发布函数执行权。前台和分析读取者只需模式 USAGE 和已发布要求视图的 SELECT 权限。源索引和审计表单独授权给审核人员。应使用可归责的数据库登录执行审核，审计记录该登录角色。

每批导入后待审核。审核者核对每条归纳及出处，再决定通过或退回，并提供原因。批准后须另行启用版本。发布后可重新启用以前批准的版本完成回退，或传入空版本撤回当前发布。测试中的批准与发布发生在临时数据库，当前用户附件在项目种子中保持待审核状态。

已启用的版本可导出为静态站点的通用招聘资料。使用拥有发布视图读取权限的连接运行：

```sh
set -o pipefail
export_dir=$(mktemp -d .recruitment-export.XXXXXX)
trap 'rm -rf "$export_dir"' EXIT
psql -XqAt -v ON_ERROR_STOP=1 -f db/recruitment/export_active.sql |
  node tools/recruitment-export.mjs > "$export_dir/reference.js"
mv "$export_dir/reference.js" src/data/recruitment-reference.js
```

导出物只包含职业标识、类别、通用要求和资料版本。启用、回退或撤回数据库版本后，静态部署需要相应地重新导出并部署。撤回所有版本时导出会报错，部署方需要移除公开资料后再发布。
