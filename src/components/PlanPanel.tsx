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
}: {
  tasks: Task[]
  today: string
  guard: LoadResult['state']
  saveError: boolean
  onFocus: (task: Task) => void
  onRetry: () => void
  onClose: () => void
  onAll: () => void
}) {
  const candidates = planCandidates(tasks, today)
  const [feedback, setFeedback] = useState<{ date: string; text: string } | null>(null)
  return (
    <PanelDialog title="오늘 계획하기" kind="plan" onClose={onClose}>
      <p className="panel-intro">
        기한과 어제 선택한 일, 높은 우선순위를 살펴보고 오늘 집중할 일을 고르세요.
      </p>
      <p className="field-hint">{today} · 선택은 바로 적용됩니다. 기한은 바꾸지 않습니다.</p>
      <PanelStorageNotice guard={guard} saveError={saveError} onRetry={onRetry} />
      {feedback?.date === today && (
        <p className="panel-feedback" role="status">
          {feedback.text}
        </p>
      )}
      {candidates.length === 0 ? (
        <div className="panel-empty">
          <h3>지금 살펴볼 계획 후보가 없습니다</h3>
          <p>다른 할 일은 전체에서 집중 대상으로 고를 수 있습니다.</p>
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
                  const focused = task.focusDate === today
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
                        {focused && <span className="plan-focused">오늘 집중 · 집중 중</span>}
                      </div>
                      <button
                        className={`secondary-button plan-focus ${focused ? 'is-focused' : ''}`}
                        aria-label={`${task.title} ${focused ? '집중 해제' : '집중하기'}`}
                        aria-pressed={focused}
                        onClick={() => {
                          onFocus(task)
                          setFeedback({
                            date: today,
                            text: focused
                              ? task.dueDate && task.dueDate <= today
                                ? '집중은 해제했습니다. 기한 때문에 오늘에도 표시됩니다. 기한 편집은 오늘 목록에서 할 수 있습니다.'
                                : '집중을 해제했습니다. 전체에는 남아 있습니다.'
                              : '오늘 집중으로 선택했습니다. 오늘 목록에 바로 표시됩니다.',
                          })
                        }}
                      >
                        {focused ? '집중 해제' : '집중하기'}
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
        <p>후보 밖의 작업도 전체에서 선택할 수 있습니다.</p>
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
