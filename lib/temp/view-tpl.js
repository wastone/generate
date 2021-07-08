/*
 * @descripte： 页面模板
 * @Author: WL
 * @Date: 2019-09-26 08:57:55
 * @Last Modified by: WL
 * @Last Modified time: 2021-04-02 11:20:10
 */

module.exports = {
  vueTemplate: (viewName, tableInfo, inputComponentName) => {
    return `<template>
  <div class="${viewName}-page">
    <div class="${viewName}-page-content">
      <st-search :option="searchOption" @search="search">
        <template slot="otherbtn">
          <el-button class="ml10" type="success" size="mini" icon="el-icon-plus" @click="add" v-permission="'btn_${viewName}_add'">
            新增
          </el-button>
        </template>
      </st-search>
      <st-table
      ref="sttable"
      url="/${tableInfo.tableName}/page"
      :query="listQuery"
      :paging="true"
      :column="tableInfo"
      :index="true">
        <template slot="${tableInfo.column[0].name}" slot-scope="scope">
          <el-button
            v-permission="'btn_${viewName}_show'"
            @click="show(scope)"
            size="mini">
            查看
          </el-button>
          <el-button
            v-permission="'btn_${viewName}_edit'"
            type="primary"
            @click="update(scope)"
            size="mini">
            编辑
          </el-button>
          <el-button
            v-permission="'btn_${viewName}_del'"
            type="danger"
            @click="deleteRow(scope)"
            size="mini">
            删除
          </el-button>
        </template>
      </st-table>
    </div>
    <!-- add/update-dialog s-->
    <el-dialog :title="addFormTitle" :visible.sync="dialogFormVisible" width="450px">
      <el-form ref="addForm" :model="addForm" :rules="rules" label-width="120px" size="small">
        ${tableInfo.column.map(v => `
        <el-form-item label="${v.comment}" prop="${v.name}">
          <el-input v-model="addForm.${v.name}" autocomplete="off" placeholder="请输入${v.comment}"></el-input>
        </el-form-item>`).join('')}
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitAddForm('addForm')" size="small">保 存</el-button>
        <el-button @click="dialogFormVisible = false" size="small">取 消</el-button>
      </div>
    </el-dialog>
    <!-- add/update-dialog e-->
    <!-- show-dialog s-->
    <el-dialog class="show-dialog" title="信息查看" :visible.sync="showDialogVisible">
      <el-form size="small" label-width="120px" label-position="left">
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
import * as ${tableInfo.tableName}Api from '@/api/${inputComponentName}'

export default {
  name: '${viewName}',
  data () {
    return {
      tableInfo: [
        ${tableInfo.column.map(v =>
    `{ prop: '${v.name}', label: '${v.comment}' },
        `).join('')}
        { prop: '${tableInfo.column[0].name}', label: '操作', width: 200, scope: true, fixed: 'right' }
      ],
      searchOption: [
        ${tableInfo.column.map(v =>
    `{ label: '${v.comment}', prop: '${v.name}' },
        `).join('')}
      ],
      listQuery: {},
      dialogFormVisible: false,
      addFormTitle: '新增${tableInfo.tableComment}',
      addForm: {
        ${tableInfo.column.map(v => `
        ${v.name}: '',`).join('')}
      },
      rules: {
        ${tableInfo.column.map(v => `
        ${v.name}: [
          { required: true, message: '请输入${v.comment}', trigger: 'blur' }
        ],`).join('')}
      },
      showDialogVisible: false,
      rowData: {}
    }
  },
  methods: {
    search (listQuery) {
      this.listQuery = listQuery
      this.$refs.sttable.reload()
    },
    add () {
      this.resetForm()
      this.dialogFormVisible = true
      this.addFormTitle = '新增${tableInfo.tableComment}'
    },
    update (scope) {
      this.resetForm()
      ${tableInfo.tableName}Api.getOne(scope.row.${tableInfo.column[0].name}).then(res => {
        ${tableInfo.column.map(v => `this.addForm.${v.name} = res.${v.name}
        `).join('')}
        this.dialogFormVisible = true
        this.addFormTitle = '编辑${tableInfo.tableComment}'
      })
    },
    submitAddForm (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          let postData = { ...this.addForm }
          if (postData.${tableInfo.column[0].name}) {
            ${tableInfo.tableName}Api.update(postData).then(res => {
              this.$ts.success('编辑保存成功')
              this.$refs.sttable.reload()
              this.resetForm()
              this.dialogFormVisible = false
            })
          } else {
            ${tableInfo.tableName}Api.add(postData).then(res => {
              this.$ts.success('新增保存成功')
              this.$refs.sttable.reload()
              this.resetForm()
              this.dialogFormVisible = false
            })
          }
        }
      })
    },
    resetForm () {
      this.addForm = Object.assign({}, this.$options.data().addForm)
      this.$nextTick(() => {
        if (this.$refs.addForm) {
          this.$refs.addForm.clearValidate()
        }
      })
    },
    deleteRow (scope) {
      this.$ts.confirm('确认删除${tableInfo.tableComment}吗？')
        .then(() => {
          ${tableInfo.tableName}Api.del(scope.row.${tableInfo.column[0].name}).then(res => {
            this.$ts.success('删除成功')
            this.$refs.sttable.reload()
          })
        })
        .catch(() => {})
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
