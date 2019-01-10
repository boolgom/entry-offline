import React, { Component } from 'react';
import './header.scss';
import root from 'window-or-global';
import _get from 'lodash/get';
import _includes from 'lodash/includes';
import Utils from '../helper/RendererUtils';
import { connect } from 'react-redux';
import { commonAction, showPopup } from '../actions';
import { CHANGE_LANGUAGE, WS_MODE } from '../actions/types';
import { Dropdown } from 'entry-tool/component';

/* global Entry, EntryStatic */
class Header extends Component {
    constructor(props) {
        super(props);
        this.dropdownList = {};
        this.state = {
            dropdownType: undefined,
        };
    }

    get programLanguageList() {
        return [
            [Utils.getLang('Menus.block_coding'), 'block'],
            [Utils.getLang('Menus.python_coding'), 'python'],
        ];
    }
    get fileList() {
        return [
            [Utils.getLang('Workspace.file_new'), 'new'],
            [Utils.getLang('Workspace.file_upload'), 'open_offline'],
        ];
    }
    get saveList() {
        return [
            [Utils.getLang('Workspace.file_save'), 'save_online'],
            [Utils.getLang('Workspace.file_save_as'), 'save_as_online'],
        ];
    }
    get helpList() {
        return [
            [Utils.getLang('Workspace.block_helper'), 'help_block'],
            [
                Utils.getLang('Workspace.hardware_guide'),
                'help_hardware',
                { isPracticalCourse: false },
            ],
            [Utils.getLang('Workspace.robot_guide'), 'help_robot', { isPracticalCourse: true }],
            [Utils.getLang('Workspace.python_guide'), 'help_python'],
        ];
    }
    get modeList() {
        return [
            [Utils.getLang('Workspace.default_mode'), 'workspace'],
            [
                <div>
                    {Utils.getLang('Workspace.practical_course_mode')}
                    <em className={'ico_workspace_practical'}>
                        {Utils.getLang('Workspace.practical_course')}
                    </em>
                </div>,
                'practical_course',
            ],
        ];
    }
    get languageList() {
        return [
            [Utils.getLang('ko'), 'ko'],
            [Utils.getLang('en'), 'en'],
            [Utils.getLang('jp'), 'jp'],
            [Utils.getLang('vn'), 'vn'],
        ];
    }

    getModeText() {
        const { common } = this.props;
        const { mode } = common;
        const [modeText] = this.modeList.find((list) => {
            return list[1] === mode;
        });
        return modeText;
    }

    handleDropdownClick(type) {
        this.setState((state) => {
            const { dropdownType } = state;
            return {
                dropdownType: dropdownType === type ? undefined : type,
            };
        });
    }

    handleProjectNameChange(value) {
        this.setState({
            projectName: value,
        });
    }

    getLangValue() {
        const lang = _get(this.props, 'common.lang');
        return _get(root.Lang, lang);
    }

    makeDropdown(type, items) {
        const { dropdownType } = this.state;
        if (type !== dropdownType) {
            return null;
        }
        const positionDom = this.dropdownList[type];
        return (
            <Dropdown
                autoWidth
                animation={false}
                items={items}
                positionDom={positionDom}
                onSelectDropdown={(item) => {
                    this.handleDropdownSelect(type, item);
                    this.setState(() => {
                        return {
                            dropdownType: undefined,
                        };
                    });
                }}
                outsideExcludeDom={[positionDom]}
                onOutsideClick={() => {
                    this.setState(() => {
                        return {
                            dropdownType: undefined,
                        };
                    });
                }}
            />
        );
    }

    handleDropdownSelect(type, item) {
        const key = item[1];
        switch (type) {
            case 'programLanguage':
                this.handleProgramLanguageClick(item);
                break;
            case 'file': {
                const { onFileAction } = this.props;
                onFileAction(key);
                break;
            }
            case 'save': {
                const { onSaveAction } = this.props;
                onSaveAction(key);
                break;
            }
            case 'help':
                this.handleHelpClick(item);
                break;
            case 'mode':
                this.handleChangeWsMode(item);
                break;
            case 'language':
                this.handleChangeLanguage(item);
                break;
        }
    }

    handleProgramLanguageClick(item) {
        const { programLanguageMode } = this.state;
        const key = item[1];
        if (programLanguageMode === key) {
            return;
        }
        const mode = {};
        if (key === 'block') {
            mode.boardType = Entry.Workspace.MODE_BOARD;
            mode.textType = -1;
        } else {
            mode.boardType = Entry.Workspace.MODE_VIMBOARD;
            mode.textType = Entry.Vim.TEXT_TYPE_PY;
            mode.runType = Entry.Vim.WORKSPACE_MODE;
        }
        // Javascript in Text Coding
        // else if (pMode == 2) {
        //     mode.boardType = Entry.Workspace.MODE_VIMBOARD;
        //     mode.textType = Entry.Vim.TEXT_TYPE_JS;
        //     mode.runType = Entry.Vim.MAZE_MODE;
        // }
        const workspace = Entry.getMainWS();
        let nowType = mode.boardType;
        if (workspace) {
            workspace.setMode(mode);
            nowType = workspace.getMode();
        }

        if (mode.boardType === nowType) {
            this.setState((state) => {
                return {
                    programLanguageMode: key,
                };
            });
        }
    }
    handleHelpClick(item) {
        const key = item[1];
        if (key === 'help_block') {
            Entry.dispatchEvent('showBlockHelper');
        }
    }
    handleChangeWsMode(item) {
        const key = item[1];
        if (key !== this.props.common.mode) {
            location.href = WS_MODE_TYPE[key].href;
        }
    }
    handleChangeLanguage(item) {
        console.log(item);
        const langType = item[1];
        // root.Lang = data;
        const { language, onReloadEntry } = this.props;
        language({ lang: langType });
        onReloadEntry();
    }

    render() {
        const { common = [], projectName = '' } = this.props;
        const { lang } = common;
        const { dropdownType } = this.state;
        const programLanguageMode = 'block';

        console.log('header', common);

        return (
            /* eslint-disable jsx-a11y/heading-has-content */
            <header className={'common_gnb'}>
                <h1 className={`${'logo'} ${'logo_gnb'}`} />
                <div className={'srch_box'}>
                    <input
                        type="text"
                        id="common_srch"
                        name="common_srch"
                        defaultValue={projectName}
                        onChange={({ target }) => {
                            const { value } = target;
                            this.handleProjectNameChange(value);
                        }}
                    />
                </div>
                <div className={'group_box'}>
                    <div className={'group_inner'}>
                        {
                            <div className={'work_space'}>
                                <a
                                    title={Utils.getLang('Workspace.language')}
                                    className={`btn_work_space btn_workspace_lang ${
                                        dropdownType === 'programLanguage' ? 'on' : ''
                                    } ${programLanguageMode}`}
                                    ref={(dom) => (this.dropdownList.programLanguage = dom)}
                                    onClick={() => {
                                        this.handleDropdownClick('programLanguage');
                                    }}
                                >
                                    <span className={'blind'}>
                                        {Utils.getLang('Workspace.language')}
                                    </span>
                                </a>
                                {this.makeDropdown('programLanguage', this.programLanguageList)}
                            </div>
                        }
                        {
                            <div className={'work_space'}>
                                <a
                                    title={Utils.getLang('Workspace.file')}
                                    className={`${'btn_work_space'} ${'btn_workspace_file'} ${
                                        dropdownType === 'file' ? 'on' : ''
                                    }`}
                                    ref={(dom) => (this.dropdownList.file = dom)}
                                    onClick={() => {
                                        this.handleDropdownClick('file');
                                    }}
                                >
                                    <span className={'blind'}>
                                        {Utils.getLang('Workspace.file')}
                                    </span>
                                </a>
                                {this.makeDropdown('file', this.fileList)}
                            </div>
                        }
                        {
                            <div className={'work_space'}>
                                <a
                                    title={Utils.getLang('Workspace.save')}
                                    className={`${'btn_work_space'} ${'btn_workspace_save'}  ${
                                        dropdownType === 'save' ? 'on' : ''
                                    }`}
                                    ref={(dom) => (this.dropdownList.save = dom)}
                                    onClick={() => {
                                        this.handleDropdownClick('save');
                                    }}
                                >
                                    <span className={'blind'}>
                                        {Utils.getLang('Workspace.save')}
                                    </span>
                                </a>
                                {this.makeDropdown('save', this.saveList)}
                            </div>
                        }
                        {
                            <div className={'work_space'}>
                                <a
                                    title={Utils.getLang('Workspace.help')}
                                    className={`${'btn_work_space'} ${'btn_workspace_help'} ${
                                        dropdownType === 'help' ? 'on' : ''
                                    }`}
                                    ref={(dom) => (this.dropdownList.help = dom)}
                                    onClick={() => {
                                        this.handleDropdownClick('help');
                                    }}
                                >
                                    <span className={'blind'}>
                                        {Utils.getLang('Workspace.help')}
                                    </span>
                                </a>
                                {this.makeDropdown('help', this.helpList)}
                            </div>
                        }
                    </div>

                    <div className={'group_inner'}>
                        <div className={'work_space'}>
                            <a
                                title={Utils.getLang('Workspace.undo')}
                                className={'btn_workspace_undo'}
                                onClick={() => {
                                    Entry.dispatchEvent('undo');
                                }}
                            >
                                <span className={'blind'}>{Utils.getLang('Workspace.undo')}</span>
                            </a>
                            <a
                                title={Utils.getLang('Workspace.redo')}
                                className={'btn_workspace_redo'}
                                onClick={() => {
                                    Entry.dispatchEvent('redo');
                                }}
                            >
                                <span className={'blind'}>{Utils.getLang('Workspace.redo')}</span>
                            </a>
                        </div>
                    </div>

                    {lang === 'ko' && (
                        <div className={'group_inner'}>
                            <div className={'work_space'}>
                                <a
                                    className={`link_workspace_text text_work_space  ${
                                        dropdownType === 'mode' ? 'on' : ''
                                    }`}
                                    ref={(dom) => (this.dropdownList.mode = dom)}
                                    onClick={() => {
                                        this.handleDropdownClick('mode');
                                    }}
                                >
                                    {this.getModeText()}
                                </a>
                                {this.makeDropdown('mode', this.modeList)}
                            </div>
                        </div>
                    )}

                    {
                        <div className={'lang_select_box'}>
                            <a
                                className={`${'select_link'} ${'ico_white_select_arr'} ${
                                    dropdownType === 'language' ? 'on' : ''
                                }`}
                                ref={(dom) => (this.dropdownList.language = dom)}
                                onClick={() => {
                                    this.handleDropdownClick('language');
                                }}
                            >
                                {this.getLangValue()}
                            </a>
                            <div className={'tooltip_box'}>
                                {this.makeDropdown('language', this.languageList)}
                            </div>
                        </div>
                    }
                </div>
            </header>
        );
    }
}

const mapStateToProps = (state) => ({
    ...state,
});

const mapDispatchToProps = {
    showPopup,
    language: (data) => commonAction(CHANGE_LANGUAGE, data),
    mode: (data) => commonAction(WS_MODE, data),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Header);