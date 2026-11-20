import { useState } from 'react'
import { dueLabel, planCandidates, planGroupLabels, type Task, type PlanGroup } from '../domain'
import type { LoadResult } from '../storage'
import { PanelDialog } from './PanelDialog'
import { PanelStorageNotice } from './PanelStorageNotice'

export function PlanPanel({
  tasks,
  today,
  guard,
  saveError,
  onFocus,
  onRetry,
  onClose,
  onAll,
  plannedIds,
}: {
  tasks: Task[]
  today: string
  guard: LoadResult['state']
  saveError: boolean
  onFocus: (task: Task) => void
  onRetry: () => void
  onClose: () => void
  onAll: () => void
  plannedIds?: string[]
}) {
  const candidates = planCandidates(tasks, today)
  const [feedback, setFeedback] = useState<{ date: string; text: string } | null>(null)
  return (
    <PanelDialog title="오늘 계획하기" kind="plan" onClose={onClose}>
      <p className="panel-intro">
        기한이 된 일과 지난번에 남긴 일을 보고 오늘 할 일을 골라 주세요.
      </p>
      <p className="field-hint">선택하면 바로 적용돼요. 기한은 바뀌지 않아요.</p>
      <PanelStorageNotice guard={guard} saveError={saveError} onRetry={onRetry} />
      {feedback?.date === today && (
        <p className="panel-feedback" role="status">
          {feedback.text}
        </p>
      )}
      {candidates.length === 0 ? (
        <div className="panel-empty">
          <h3>지금 추천할 일이 없어요</h3>
          <p>전체 목록에서 오늘 할 일을 직접 골라 주세요.</p>
          <button className="secondary-button" onClick={onAll}>
            전체 할 일 보기
          </button>
        </div>
      ) : (
        (Object.keys(planGroupLabels) as PlanGroup[]).map((group) => {
          const rows = candidates.filter((candidate) => candidate.group === group)
          if (!rows.length) return null
          return (
            <section className="plan-group" key={group} aria-label={planGroupLabels[group]}>
              <h3>
                {planGroupLabels[group]} <span>{rows.length}</span>
              </h3>
              <ul>
                {rows.map(({ task, reasons }) => {
                  const focused = plannedIds
                    ? plannedIds.includes(task.id)
                    : task.focusDate === today
                  return (
                    <li key={task.id} className="plan-row" data-task-id={task.id}>
                      <div className="plan-task">
                        <strong>{task.title}</strong>
                        <div className="plan-reasons">
                          {reasons.map((reason) => (
                            <span key={reason}>{reason}</span>
                          ))}
                        </div>
                        <p className="plan-meta">
                          {[task.dueDate && dueLabel(task.dueDate, today), task.category]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        {focused && <span className="plan-focused">오늘 계획에 포함됨</span>}
                      </div>
                      <button
                        className={`secondary-button plan-focus ${focused ? 'is-focused' : ''}`}
                        aria-label={`${task.title} ${focused ? '오늘에서 빼기' : '오늘에 넣기'}`}
                        aria-pressed={focused}
                        onClick={() => {
                          onFocus(task)
                          setFeedback({
                            date: today,
                            text: focused
                              ? !plannedIds && task.dueDate && task.dueDate <= today
                                ? '오늘 선택은 해제했어요. 기한이 오늘까지라 목록에는 남아 있어요. 목록으로 돌아가 제목을 누르면 기한을 바꿀 수 있어요.'
                                : '오늘 계획에서 뺐어요. 전체 목록에는 그대로 남아 있어요.'
                              : '오늘 할 일에 넣었어요. 오늘 목록에서 바로 확인할 수 있어요.',
                          })
                        }}
                      >
                        {focused ? '오늘에서 빼기' : '오늘에 넣기'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })
      )}
      <div className="panel-bottom">
        <p>다른 일도 전체 목록에서 고를 수 있어요.</p>
        {candidates.length > 0 && (
          <button className="text-button" onClick={onAll}>
            전체 할 일 보기
          </button>
        )}
        <button className="primary-button" onClick={onClose}>
          오늘 목록으로 돌아가기
        </button>
      </div>
    </PanelDialog>
  )
}
