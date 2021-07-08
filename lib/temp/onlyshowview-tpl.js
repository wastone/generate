/*
 * @descripte： 页面模板
 * @Author: WL
 * @Date: 2019-09-26 08:57:55
 * @Last Modified by: WL
 * @Last Modified time: 2021-04-02 15:40:20
 */

module.exports = {
  onlyShowVueTemplate: (viewName, tableInfo) => {
    return `<template>
  <div class="${viewName}-page">
    <div class="${viewName}-page-content">
      <st-search :option="searchOption" @search="search">
      </st-search>
      <st-table
      ref="sttable"
      url="/${viewName}/page"
      :query="listQuery"
      :column="tableInfo"
      index>
        <template slot="${tableInfo.column[0].name}" slot-scope="scope">
          <el-button
            @click="show(scope)"
            size="mini">
            查看
          </el-button>
        </template>
      </st-table>
    </div>
    <!-- show-dialog s-->
    <el-dialog class="show-dialog" title="信息查看" :visible.sync="showDialogVisible">
      <el-form size="small" label-width="105px" label-position="left">
        ${tableInfo.column.map(v => `
        <el-form-item label="${v.comment}">
          <span>{{rowData.${v.name}}}</span>
        </el-form-item>`).join('')}
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showDialogVisible = false" size="small">关 闭</el-button>
      </div>
    </el-dialog>
    <!-- show-dialog e-->
  </div>
</template>
<script>

export default {
  name: '${viewName}',
  data () {
    return {
      tableInfo: [
        ${tableInfo.column.map(v =>
    `{ prop: '${v.name}', label: '${v.comment}' },
        `).join('')}
        { prop: '${tableInfo.column[0].name}', label: '操作', width: 240, scope: true }
      ],
      searchOption: [
        ${tableInfo.column.map(v =>
    `{ label: '${v.comment}', prop: '${v.name}' },
        `).join('')}
      ],
      listQuery: {},
      showDialogVisible: false,
      rowData: {}
    }
  },
  methods: {
    search (listQuery) {
      this.listQuery = listQuery
      this.$refs.sttable.reload()
    },
    show (scope) {
      this.rowData = scope.row
      this.showDialogVisible = true
    }
  }
}
</script>
`
  }
}
