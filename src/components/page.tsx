import * as React from "react"
import { FeedContainer } from "../containers/feed-container"
import { AnimationClassNames, Icon, FocusTrapZone } from "@fluentui/react"
import ArticleContainer from "../containers/article-container"
import { ViewType } from "../schema-types"
import ArticleSearch from "./utils/article-search"

type PageProps = {
    menuOn: boolean
    contextOn: boolean
    settingsOn: boolean
    feeds: string[]
    itemId: number
    itemFromFeed: boolean
    viewType: ViewType
    dismissItem: () => void
    offsetItem: (offset: number) => void
}

type PageState = {
    articleWidth: number
}

const MIN_ARTICLE_WIDTH = 600
const MAX_ARTICLE_WIDTH = 1400
const DEFAULT_ARTICLE_WIDTH = 860

class Page extends React.Component<PageProps, PageState> {
    private resizing = false
    private resizeEdge: "left" | "right" | null = null
    private startX = 0
    private startWidth = 0

    constructor(props: PageProps) {
        super(props)
        const savedWidth = localStorage.getItem("articleWidth")
        this.state = {
            articleWidth: savedWidth
                ? parseInt(savedWidth)
                : DEFAULT_ARTICLE_WIDTH,
        }
    }

    offsetItem = (event: React.MouseEvent, offset: number) => {
        event.stopPropagation()
        this.props.offsetItem(offset)
    }
    prevItem = (event: React.MouseEvent) => this.offsetItem(event, -1)
    nextItem = (event: React.MouseEvent) => this.offsetItem(event, 1)

    handleResizeStart = (e: React.MouseEvent, edge: "left" | "right") => {
        e.preventDefault()
        e.stopPropagation()
        this.resizing = true
        this.resizeEdge = edge
        this.startX = e.clientX
        this.startWidth = this.state.articleWidth
        document.addEventListener("mousemove", this.handleResizeMove)
        document.addEventListener("mouseup", this.handleResizeEnd)
        document.body.style.cursor = "ew-resize"
        document.body.style.userSelect = "none"
    }

    handleResizeMove = (e: MouseEvent) => {
        if (!this.resizing || !this.resizeEdge) return

        const delta = e.clientX - this.startX
        let newWidth = this.startWidth

        if (this.resizeEdge === "right") {
            newWidth = this.startWidth + delta * 2
        } else {
            newWidth = this.startWidth - delta * 2
        }

        newWidth = Math.max(
            MIN_ARTICLE_WIDTH,
            Math.min(MAX_ARTICLE_WIDTH, newWidth)
        )
        this.setState({ articleWidth: newWidth })
    }

    handleResizeEnd = () => {
        if (!this.resizing) return
        this.resizing = false
        this.resizeEdge = null
        document.removeEventListener("mousemove", this.handleResizeMove)
        document.removeEventListener("mouseup", this.handleResizeEnd)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        localStorage.setItem("articleWidth", this.state.articleWidth.toString())
    }

    render = () =>
        this.props.viewType !== ViewType.List ? (
            <>
                {this.props.settingsOn ? null : (
                    <div
                        key="card"
                        className={
                            "main" + (this.props.menuOn ? " menu-on" : "")
                        }>
                        <ArticleSearch />
                        {this.props.feeds.map(fid => (
                            <FeedContainer
                                viewType={this.props.viewType}
                                feedId={fid}
                                key={fid + this.props.viewType}
                            />
                        ))}
                    </div>
                )}
                {this.props.itemId && (
                    <FocusTrapZone
                        disabled={this.props.contextOn}
                        ignoreExternalFocusing={true}
                        isClickableOutsideFocusTrap={true}
                        className="article-container"
                        onClick={this.props.dismissItem}>
                        <div
                            className="article-wrapper"
                            style={{ width: this.state.articleWidth }}
                            onClick={e => e.stopPropagation()}>
                            <div
                                className="resize-handle resize-handle-left"
                                onMouseDown={e =>
                                    this.handleResizeStart(e, "left")
                                }
                            />
                            <ArticleContainer itemId={this.props.itemId} />
                            <div
                                className="resize-handle resize-handle-right"
                                onMouseDown={e =>
                                    this.handleResizeStart(e, "right")
                                }
                            />
                        </div>
                        {this.props.itemFromFeed && (
                            <>
                                <div className="btn-group prev">
                                    <a className="btn" onClick={this.prevItem}>
                                        <Icon iconName="Back" />
                                    </a>
                                </div>
                                <div className="btn-group next">
                                    <a className="btn" onClick={this.nextItem}>
                                        <Icon iconName="Forward" />
                                    </a>
                                </div>
                            </>
                        )}
                    </FocusTrapZone>
                )}
            </>
        ) : (
            <>
                {this.props.settingsOn ? null : (
                    <div
                        key="list"
                        className={
                            "list-main" + (this.props.menuOn ? " menu-on" : "")
                        }>
                        <ArticleSearch />
                        <div className="list-feed-container">
                            {this.props.feeds.map(fid => (
                                <FeedContainer
                                    viewType={this.props.viewType}
                                    feedId={fid}
                                    key={fid}
                                />
                            ))}
                        </div>
                        {this.props.itemId ? (
                            <div className="side-article-wrapper">
                                <ArticleContainer itemId={this.props.itemId} />
                            </div>
                        ) : (
                            <div className="side-logo-wrapper">
                                <img
                                    className="light"
                                    src="icons/logo-outline.svg"
                                />
                                <img
                                    className="dark"
                                    src="icons/logo-outline-dark.svg"
                                />
                            </div>
                        )}
                    </div>
                )}
            </>
        )
}

export default Page
