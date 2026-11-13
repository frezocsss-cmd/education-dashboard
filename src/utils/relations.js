import { api } from '@/services/api'

/**
 * O'quvchi yozuvini guruh va ota-ona kolleksiyalaridagi ro'yxatlar bilan sinxronlaydi.
 * Bu bog'lanishlar group.studentIds va parent.studentIds maydonlarida saqlanadi.
 */
export async function syncStudentRelations({ previous, next, groups = [], parents = [] }) {
  const tasks = []

  if (!previous || String(previous.groupId || '') !== String(next.groupId || '')) {
    if (previous?.groupId) {
      const oldGroup = groups.find((item) => String(item.id) === String(previous.groupId))
      if (oldGroup) {
        tasks.push(
          api.patch('groups', oldGroup.id, {
            studentIds: (oldGroup.studentIds || []).filter(
              (id) => String(id) !== String(previous.id),
            ),
          }),
        )
      }
    }
    if (next.groupId) {
      const newGroup = groups.find((item) => String(item.id) === String(next.groupId))
      if (newGroup && !(newGroup.studentIds || []).map(String).includes(String(next.id))) {
        tasks.push(
          api.patch('groups', newGroup.id, {
            studentIds: [...(newGroup.studentIds || []), next.id],
          }),
        )
      }
    }
  }

  if (!previous || String(previous.parentId || '') !== String(next.parentId || '')) {
    if (previous?.parentId) {
      const oldParent = parents.find((item) => String(item.id) === String(previous.parentId))
      if (oldParent) {
        tasks.push(
          api.patch('parents', oldParent.id, {
            studentIds: (oldParent.studentIds || []).filter(
              (id) => String(id) !== String(previous.id),
            ),
          }),
        )
      }
    }
    if (next.parentId) {
      const newParent = parents.find((item) => String(item.id) === String(next.parentId))
      if (newParent && !(newParent.studentIds || []).map(String).includes(String(next.id))) {
        tasks.push(
          api.patch('parents', newParent.id, {
            studentIds: [...(newParent.studentIds || []), next.id],
          }),
        )
      }
    }
  }

  if (tasks.length) await Promise.all(tasks)
}

/**
 * O'quvchi o'chirilganda uning guruh va ota-ona ro'yxatlaridagi havolalarini tozalaydi.
 * To'lov va davomat yozuvlarini chaqiruvchi tomon o'zi o'chiradi.
 */
export async function detachStudentRelations({ student, groups = [], parents = [] }) {
  const tasks = []

  const group = groups.find((item) => String(item.id) === String(student.groupId))
  if (group) {
    tasks.push(
      api.patch('groups', group.id, {
        studentIds: (group.studentIds || []).filter((id) => String(id) !== String(student.id)),
      }),
    )
  }

  const parent = parents.find((item) => String(item.id) === String(student.parentId))
  if (parent) {
    tasks.push(
      api.patch('parents', parent.id, {
        studentIds: (parent.studentIds || []).filter((id) => String(id) !== String(student.id)),
      }),
    )
  }

  await Promise.all(tasks)
}

/**
 * Guruhdagi o'quvchilar ro'yxatini o'zgartirganda o'quvchi yozuvlarini ham yangilaydi.
 */
export async function syncGroupStudents({ group, nextStudentIds, groups = [], students = [] }) {
  const previousIds = (group.studentIds || []).map(String)
  const nextIds = nextStudentIds.map(String)
  const added = nextIds.filter((id) => !previousIds.includes(id))
  const removed = previousIds.filter((id) => !nextIds.includes(id))

  const moved = added
    .map((id) => students.find((student) => String(student.id) === id))
    .filter((student) => student?.groupId && String(student.groupId) !== String(group.id))

  const tasks = [
    api.patch('groups', group.id, { studentIds: nextStudentIds.map(Number) }),
    ...added.map((id) => api.patch('students', id, { groupId: group.id, courseId: group.courseId })),
    ...removed.map((id) => api.patch('students', id, { groupId: null })),
    ...moved.map((student) => {
      const oldGroup = groups.find((item) => String(item.id) === String(student.groupId))
      if (!oldGroup) return Promise.resolve()
      return api.patch('groups', oldGroup.id, {
        studentIds: (oldGroup.studentIds || []).filter(
          (id) => String(id) !== String(student.id),
        ),
      })
    }),
  ]

  await Promise.all(tasks)
}

/**
 * Guruh o'chirilganda o'quvchilardagi groupId havolasini tozalaydi.
 */
export async function detachGroupRelations({ group, students = [] }) {
  const related = students.filter((student) => String(student.groupId) === String(group.id))
  if (!related.length) return
  await Promise.all(related.map((student) => api.patch('students', student.id, { groupId: null })))
}

/**
 * Ota-onaga bog'langan farzandlar ro'yxatini o'zgartirganda
 * o'quvchilardagi parentId maydonini ham yangilaydi.
 */
export async function syncParentStudents({ parent, nextStudentIds }) {
  const previousIds = (parent.studentIds || []).map(String)
  const nextIds = nextStudentIds.map(String)
  const added = nextIds.filter((id) => !previousIds.includes(id))
  const removed = previousIds.filter((id) => !nextIds.includes(id))

  const payload = {
    parentId: parent.id,
    parentName: `${parent.firstName} ${parent.lastName}`,
    parentPhone: parent.phone,
  }

  const tasks = [
    api.patch('parents', parent.id, { studentIds: nextStudentIds.map(Number) }),
    ...added.map((id) => api.patch('students', id, payload)),
    ...removed.map((id) => api.patch('students', id, { parentId: null })),
  ]

  await Promise.all(tasks)
}

/**
 * Ota-onaning ismi yoki telefoni o'zgarganda o'quvchilardagi nusxani yangilaydi.
 */
export async function syncParentContact({ parent, students = [] }) {
  const related = students.filter((student) => String(student.parentId) === String(parent.id))
  if (!related.length) return
  await Promise.all(
    related.map((student) =>
      api.patch('students', student.id, {
        parentName: `${parent.firstName} ${parent.lastName}`,
        parentPhone: parent.phone,
      }),
    ),
  )
}

/**
 * Ota-ona o'chirilganda o'quvchilardagi parentId havolasini tozalaydi.
 */
export async function detachParentRelations({ parent, students = [] }) {
  const related = students.filter((student) => String(student.parentId) === String(parent.id))
  if (!related.length) return
  await Promise.all(related.map((student) => api.patch('students', student.id, { parentId: null })))
}

/**
 * To'lov o'zgargandan so'ng o'quvchining joriy to'lov holatini eng so'nggi oy bo'yicha yangilaydi.
 */
export async function refreshStudentPaymentStatus(studentId) {
  if (!studentId) return
  const payments = await api.list('payments', { studentId })
  const latest = [...payments].sort((a, b) => String(b.month || '').localeCompare(String(a.month || '')))[0]
  await api.patch('students', studentId, { paymentStatus: latest?.status || 'unpaid' })
}

/**
 * O'qituvchi o'chirilganda guruhlardagi teacherId havolasini tozalaydi.
 */
export async function detachTeacherRelation({ teacher, groups = [] }) {
  const related = groups.filter((group) => String(group.teacherId) === String(teacher.id))
  if (!related.length) return
  await Promise.all(
    related.map((group) => api.patch('groups', group.id, { teacherId: null })),
  )
}
