import React from 'react'
import PropTypes from 'prop-types'

import Token from './token'

class ReactToken extends React.Component {
  static propTypes = {
    autocompleteOptions: PropTypes.array,
    disabled: PropTypes.bool,
    onAdd: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyUp: PropTypes.func,
    onRemove: PropTypes.func,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    selected: PropTypes.array
  }

  static defaultProps = {
    autocompleteOptions: [],
    disabled: false,
    onAdd() {},
    onBlur() {},
    onFocus() {},
    onKeyUp() {},
    onRemove() {},
    placeholder: '',
    required: false,
    selected: []
  }

  keyMap = {
    BACKSPACE: 8,
    DOWN_ARROW: 40,
    ENTER: 13,
    ESC: 27,
    UP_ARROW: 38
  }

  constructor(props) {
    super(props)

    this.state = {
      focused: false,
      hideAutocomplete: false,
      inputValue: '',
      inputWidth: null,
      selectedAutocompleteIdx: -1,
      tokens: this.props.selected
    }
  }

  componentDidMount() {
    window.addEventListener('click', this.onClick)
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onClick)
  }

  onClick = (e) => {
    if (!this.container.contains(e.target)) {
      this.setState({hideAutocomplete: true})
    }
  }

  focusInput = (e) => {
    this.input.focus()
  }

  onFocus = (e) => {
    this.setState({focused: true}, () => {
      this.props.onFocus(e)
    })
  }

  onBlur = (e) => {
    this.setState({focused: false}, () => {
      this.props.onBlur(e)
    })
  }

  onKeyUp = (e) => {
    if (e.keyCode === this.keyMap.ENTER && this.input.value.length > 0) {
      const value = this.state.selectedAutocompleteIdx >= 0
        ? this.props.autocompleteOptions[this.state.selectedAutocompleteIdx]
        : this.input.value

      this.setState({
        selectedAutocompleteIdx: -1,
        tokens: [...this.state.tokens, value],
        inputValue: '',
        hideAutocomplete: false
      }, () => {
        this.props.onAdd(this.input.value)
        this.input.value = ''
      })
    } else if (e.keyCode === this.keyMap.BACKSPACE && this.state.inputValue.length === 0) {
      this.removeToken(this.state.tokens.length - 1)()
      this.setState({inputValue: ''})
    } else if (e.keyCode === this.keyMap.ESC) {
      this.setState({hideAutocomplete: true})
    } else if (e.keyCode === this.keyMap.DOWN_ARROW && this.state.inputValue !== '') {
      const nextIdx = this.state.selectedAutocompleteIdx + 1 >= this.props.autocompleteOptions.length
        ? 0
        : this.state.selectedAutocompleteIdx + 1
      this.setState({selectedAutocompleteIdx: nextIdx})
    } else if (e.keyCode === this.keyMap.UP_ARROW  && this.state.inputValue !== '') {
      const nextIdx = this.state.selectedAutocompleteIdx - 1 < 0
        ? this.props.autocompleteOptions.length - 1
        : this.state.selectedAutocompleteIdx - 1
      this.setState({selectedAutocompleteIdx: nextIdx})
    } else {
      this.setState({
        inputWidth: this.calcWidth(this.input.value),
        inputValue: this.input.value,
        hideAutocomplete: false,
        selectedAutocompleteIdx: -1
      })
    }

    this.props.onKeyUp(e)
  }

  highlightOption = (idx) => () => {
    this.setState({selectedAutocompleteIdx: idx})
  }

  selectAutoCompleteOption = (idx) => () => {
    this.setState({
      hideAutocomplete: false,
      inputValue: '',
      selectedAutocompleteIdx: -1,
      tokens: [...this.state.tokens, this.props.autocompleteOptions[idx]]
    }, () => {
      this.input.value = ''
    })
  }

  removeToken = (index) => () => {
    const removedToken = this.state.tokens[index]
    let tokens = this.state.tokens
    tokens.splice(index, 1)

    this.setState({tokens}, () => {
      this.props.onRemove(removedToken)
    })
  }

  calcWidth(val) {
    const tmp = document.createElement('div')
    tmp.style.padding = '0'
    tmp.style.width = ''
    tmp.style.position = 'absolute'
    tmp.style.left = '-9999'
    tmp.style.fontFamily = '"Sofia Pro", "Helvetica", "Arial", sans-serif'
    tmp.style.fontSize = '11px'
    tmp.innerText = val
    this.input.parentNode.appendChild(tmp)
    const width = tmp.clientWidth
    this.input.parentNode.removeChild(tmp)

    return width + 40
  }

  renderRequired() {
    const styles = {
      container: {
        color: '#ACACAC',
        fontWeight: 200,
        overflow: 'hidden',
        position: 'absolute',
        right: 10,
        top: 8
      },
      span: {
        position: 'relative',
        transition: 'all 200ms',
        top: 0
      }
    }

    const spanStyle = this.state.focused || this.state.tokens.length > 0
      ? {...styles.span, top: -20}
      : styles.span

    return (
      <div style={styles.container}>
        <span style={spanStyle}>required</span>
      </div>
    )
  }

  renderTokens() {
    return this.state.tokens.map((token, idx) => (<Token text={token} key={idx} onRemove={this.removeToken(idx)} />))
  }

  renderAutoComplete() {
    const styles = {
      container: {
        position: 'absolute',
        top: '100%',
        left: 0,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: '#D6D5D5',
        color: '#000000',
        zIndex: 1,
        width: '100%',
        borderRadius: '3px',
        cursor: 'pointer'
      },
      option: {
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 2,
        paddingBottom: 2
      },
      highlighted: {
        backgroundColor: '#E4E2E2'
      }
    }

    return (
      <div style={styles.container} className="rt-suggestions">
        {this.props.autocompleteOptions.map((option, idx) => {
          const style = this.state.selectedAutocompleteIdx === idx
            ? { ...styles.option, ...styles.highlighted }
            : styles.option

          return (
            <div
              key={`autocomplete-${idx}`}
              onClick={this.selectAutoCompleteOption(idx)}
              onMouseOver={this.highlightOption(idx)}
              style={style}
            >
              {option}
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    const width = this.state.inputValue !== ''
      ? this.state.inputWidth
      : '100%'

    const styles = {
      container: {
        width: '100%',
        border: '1px solid #F1F1F1',
        padding: 5,
        fontFamily: '"Sofia Pro", "Helvetica", "Arial", sans-serif'
      },
      ul: {
        backgroundColor: '#F1F1F1',
        border: '1px solid #F1F1F1',
        borderRadius: '3px',
        cursor: 'text',
        display: 'flex',
        flexWrap: 'wrap',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0,
        lineHeight: '24px',
        listStyle: 'none',
        padding: '4px 6px',
        position: 'relative',
        willChange: 'transform',
        zIndex: 1
      },
      li: {
        display: 'inline-flex'
      },
      inputContainer: {
        display: 'inline-flex',
        position: 'relative'
      },
      input: {
        backgroundColor: '#F1F1F1',
        fontFamily: '"Sofia Pro", "Helvetica", "Arial", sans-serif',
        paddingTop: 1,
        paddingLeft: 1,
        paddingBottom: 1,
        paddingRight: 20,
        width,
        border: 'none',
        outline: 'none',
        marginTop: 9,
        marginBottom: 9,
        boxSizing: 'border-box',
      }
    }

    const shouldRenderAutocomplete = this.state.inputValue !== '' && this.props.autocompleteOptions.length > 0 && !this.state.hideAutocomplete

    return (
      <div style={styles.container} className="rt-container" ref={(r) => this.container = r}>
        <ul style={styles.ul} onClick={this.focusInput}>
          {this.renderTokens()}
          <li style={styles.li}>
            <div style={styles.inputContainer}>
              <input
                disabled={this.props.disabled}
                ref={(r) => this.input = r}
                type="text"
                role="combobox"
                style={styles.input}
                onKeyUp={this.onKeyUp}
                placeholder={this.props.placeholder}
                onFocus={this.onFocus}
                onBlur={this.onBlur}
              />
            </div>
          </li>
          {shouldRenderAutocomplete && this.renderAutoComplete()}
          {this.renderRequired()}
        </ul>
      </div>
    );
  }
}

export default ReactToken
// module.exports = ReactToken
